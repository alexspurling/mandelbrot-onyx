const decodeOnyxString = (memory, ptr, len) => {
  let v = new DataView(memory.buffer);

  let s = "";
  for (let i = 0; i < len; i++) {
      s += String.fromCharCode(v.getUint8(ptr + i));
  }

  return s;
}

const logOnyxString = (memory, ptr, len) => {
  console.log(decodeOnyxString(memory, ptr, len));
}

const onyx_kill_thread = () => {
  console.log("Worker thread killed");
}

let wasmModule;

async function initWasm(memory) {
  wasmModule = await fetch("mandelbrot.wasm")
    .then(response => response.arrayBuffer())
    .then(bytes => {
        return WebAssembly.instantiate(bytes, {
          host: {
              print_str: (ptr, len) => logOnyxString(memory, ptr, len),
              time: Date.now,
              kill_thread: onyx_kill_thread
          },
          onyx: {
              memory: memory
          }
        });
      }
    );
}

function initOnyx() {
  wasmModule.instance.exports._initialize();
  return {
    canvasSize: wasmModule.instance.exports.getCanvasSize(),
    canvasPointer: wasmModule.instance.exports.getCanvasPointer(),
  }
}

onmessage = async (msg) => {
  if (msg.data.msg === "initwasm") {
    // This needs to be done once by all threads
    await initWasm(msg.data.memory);
    postMessage({msg:"wasminitialised"});
  } else if (msg.data.msg === "initonyx") {
    // This needs to be done once by one thread
    let canvasRef = initOnyx();
    postMessage({msg:"onyxinitialised", canvasRef: canvasRef});
  } else if (msg.data.msg === "reset") {
    wasmModule.instance.exports.reset();
    postMessage({msg:"reset"});
  } else if (msg.data.msg === "render") {
    const {
      config: { x, y, d },
      id
    } = msg.data.params;
    const startTime = performance.now();
    const count = wasmModule.instance.exports.run(x, y, d, id);
    const timeTaken = performance.now() - startTime;
    console.log("Thread", id, "processed", count, "pixels in", timeTaken.toFixed(2), "ms");
    postMessage({msg:"rendered"});
  }
};
