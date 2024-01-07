
class Mutex {
    constructor(arr) {
        // Shared Int32Array with a single element
        this.sharedArray = arr;
        Atomics.store(this.sharedArray, 0, 0); // 0 means unlocked
    }

    lock() {
        while (Atomics.compareExchange(this.sharedArray, 0, 0, 1) !== 0) {
            // Wait until the lock is unlocked
            Atomics.wait(this.sharedArray, 0, 1);
        }
    }

    unlock() {
        Atomics.store(this.sharedArray, 0, 0); // Unlock the mutex
        Atomics.notify(this.sharedArray, 0, 1); // Notify waiting threads, if any
    }
}