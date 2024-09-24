# @vgerbot/channel ![Build Status](https://github.com/y1j2x34/channel-ts/actions/workflows/runtest.yml/badge.svg) [![codecov](https://codecov.io/gh/vgerbot-libraries/tschannel/branch/master/graph/badge.svg?token=fPomBmOknB)](https://codecov.io/gh/vgerbot-libraries/tschannel)

`@vgerbot/channel` is a message-passing abstraction layer implemented in TypeScript. It simplifies communication between different contexts, allowing developers to create and call classes and methods across different environments (e.g., main thread and Web Workers) in a clean, idiomatic way.

## ✨ Key Features

1. **Encapsulation**: Abstracts communication details and provides a consistent high-level API.
2. **Isolation**: Data is securely isolated using `channel-id` to ensure safe communication.
3. **Simple API**: Remote calls are as easy as regular asynchronous function calls, with support for callbacks and consistent error handling.
4. **Parallel Execution**: Supports task decomposition into multiple target contexts for parallel execution, enhancing performance.
5. **Extensibility**: Allows for custom communicators, making it easy to extend and add new features.

## 🚀 Getting Started

### 📦 Installation

Install the library using npm:

```sh
npm install @vgerbot/channel
```

### 📘 Example Usage

Here’s a simple example demonstrating communication between the main thread and a Web Worker.

#### Define the interface `api.ts`

```ts
export interface SpellChecker {
    saveToDictionary(word: string): void;
    setCaseSensitive(caseSensitive: boolean): void;
    check(sentence: string): boolean;
}
```

#### Implement the interface in the Worker `task.ts`

```ts
import { channel } from '@vgerbot/channel';
import { SpellChecker } from './api';

// Create a channel named 'worker-channel' and connect it to the main thread
const chnl = channel('worker-channel')
    .connectToMainThread()
    .create();

// Define a CPU-intensive method
chnl.def_method(function performCPUIntensiveCalculation() {
    return 'Result!';
});

// Implement the SpellChecker interface
chnl.def_class(class DefaultSpellCheckerImpl implements SpellChecker {
    saveToDictionary(word: string) {
        console.log(`Saving ${word} to dictionary`);
    }
    setCaseSensitive(caseSensitive: boolean) {
        console.log(`Set case sensitive: ${caseSensitive}`);
    }
    check(sentence: string) {
        return sentence === sentence.toLowerCase();
    }
});
```

#### Call the Worker from the main thread `main.ts`

```ts
import { channel } from '@vgerbot/channel';
import { SpellChecker } from './api';

// Create a channel named 'worker-channel' and connect it to the Worker
const chnl = channel('worker-channel')
    .connectToWorker('./task.js')
    .create();

// Call the CPU-intensive method defined in the Worker
const performCPUIntensiveCalculation = chnl.get_method<() => string>('performCPUIntensiveCalculation');
performCPUIntensiveCalculation().then(console.log); // Output: "Result!"

// Retrieve the SpellChecker class from the Worker
const DefaultSpellCheckerImpl = chnl.get_class<SpellChecker>('DefaultSpellCheckerImpl');

// Create an instance of SpellChecker
const spellChecker = new DefaultSpellCheckerImpl();
spellChecker.saveToDictionary('halo');
spellChecker.setCaseSensitive(false);
spellChecker.check('Halo world!').then(console.log); // Output: false

// Manually destroy the remote instance to free up resources
spellChecker.__destroy__();
```

### Notes

Since JavaScript’s garbage collection cannot automatically clean up remote instances, it is recommended to call `__destroy__()` when the instance is no longer needed to avoid memory leaks.

For more examples, please refer to [examples](https://github.com/vgerbot-libraries/tschannel/tree/master/packages/examples) and unit tests.

## 🔧 Supported Parameter Types

`@vgerbot/channel` supports all data types that can be cloned using the Structured Clone Algorithm. For more details, refer to the [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm).

Additionally, it supports remote objects and callback functions as parameters, but these types cannot be nested within other objects.

## 📜 License

`@vgerbot/channel` is open-source and released under the terms of the [MIT License](https://github.com/y1j2x34/tschannel/blob/master/LICENSE).
