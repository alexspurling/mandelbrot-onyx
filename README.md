# Multithreaded Onyx Mandelbrot

Example of how to use WebWorkers and shared memory to render the mandelbrot fractal in Onyx.

![screenshot](fractal.png)

View a live demo here: https://alexspurling.github.io/mandelbrot-onyx/

To compile locally, run:

```
onyx build mandelbrot.onyx -o mandelbrot.wasm -r js --multi-threaded
```

### Differences between the Onyx and AssemblyScript versions

This project is a translation of the AssemblyScript version which can be found here: https://github.com/alexspurling/mandelbrot-assemblyscript

The major differences are that because the Onyx version manages its own memory we have to define a function that returns the address of the pixel data buffer rather than hardcoding its memory location. Also, I found that because the process of instantiating the WebAssembly module and calling `exports._initialize()` is not thread safe, a mutex was required so that threads do not interfere during the initialisation process.

### Note about Cross-Origin headers

Because this code relies on SharedArrayBuffers, certain headers must be set in order for your browser to allow them to be used.

When running locally, I use VSCode's Live Preview extension with the following custom config:

```
"livePreview.httpHeaders": {
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "require-corp"
},
```

When running on github.io, I use this hack: https://github.com/gzuidhof/coi-serviceworker

More info here: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements

