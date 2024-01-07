importScripts("mutex.js");

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

onmessage = ({ data }) => {
  const {
    mutexArr,
    memory,
    config: { x, y, d },
    id
  } = data;

  const mutex = new Mutex(mutexArr);

  fetch("mandelbrot.wasm")
    .then(response => response.arrayBuffer())
    .then(bytes => {
        // Instantiating and initialising the WebAssembly object does not appear to be thread safe
        // so we have to use a mutex to ensure each thread is initialised independently
        // Another way we could do this is with message passing to and from the main thread
        mutex.lock();
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
    )
    .then(({ instance }) => {
      instance.exports._initialize();
      // We are now initialised so notify the other threads
      mutex.unlock();

      console.log("starting", id);
      const startTime = performance.now();
      const count = instance.exports.run(x, y, d, id);
      const timeTaken = performance.now() - startTime;
      const canvasRef = {
        canvasSize: instance.exports.getCanvasSize(),
        canvasPointer: instance.exports.getCanvasPointer(),
      }
      console.log("Thread", id, "processed", count, "pixels in", timeTaken, "ms");
      postMessage({msg:"done", canvasRef: canvasRef});
    });
};
