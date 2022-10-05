# @vgerbot/channel ![tschannel workflow](https://github.com/y1j2x34/channel-ts/actions/workflows/runtest.yml/badge.svg) [![codecov](https://codecov.io/gh/vgerbot-libraries/tschannel/branch/master/graph/badge.svg?token=fPomBmOknB)](https://codecov.io/gh/vgerbot-libraries/tschannel)

---

This is a messaging abstraction layer implemented by Typescript. Its purpose is to encapsulate the details of message passing, so that js can construct classes that exist in different contexts and call methods in different contexts in an idiomatic way.

## Features

1. Encapsulation: Encapsulates communication details and provides consistent upper-layer APIs
2. Isolation: Data is securely isolated in different channel-ids.
3. API: Idiomatic API, remote calls are as simple as ordinary asynchronous calls, support callback functions, and exception handling is consistent with ordinary asynchronous methods
4. Parallel: support decomposing tasks into multiple target contexts for parallel execution
5. Extension: support custom communicator to for more features

## Getting started

### Install

```sh
npm i -s @vgerbot/channel
```

Then install `@vgerbot/channel-transformer`, this is to simplify stuffs and make channel APIs more convenient to use

```sh
npm i -D @vgerbot/channel-transformer
```

For more information about the usage of `@vgerbot/channel-transformer` please refer <https://github.com/vgerbot-libraries/tschannel/blob/master/packages/transformer/README.md>

### Sample Usage

// api.ts
```ts
export interface SpellChecker {
    saveToDictionary(word: string);
    setCaseSensitive(caseSensitive: boolean);
    check(sentence: string): boolean;
}
```

task.ts
```ts
import { channel } from '@vgerbot/channel';
import { SpellChecker } form './api';

const chnl = channel('worker-channel')
    .connectToMainThread()
    .create();

chnl.def_method(function performCPUIntensiveCalculation() {
    return 'Result!';
});

chnl.def_class(class DefaultSpellCheckerImpl implements SpellChecker {
    saveToDictionary(word: string) {}
    setCaseSensitive(caseSensitive: boolean) {}
    check(sentence) {
        return true;
    }
})
```

```ts
import { channel } from '@vgerbot/channel';
import { SpellChecker } form './api';

const chnl = channel('worker-channel')
    .connectToWorker('./task.js')
    .create();

const performCPUIntensiveCalculation = chnl.get_method<() => string>('performCPUIntensiveCalculation');
performCPUIntensiveCalculation().then(console.log) // Console Output: "Result!"

const DefaultSpellCheckerImpl = chnl.get_class<SpellChecker>('DefaultSpellCheckerImpl');

const spellChecker = new DefaultSpellCheckerImpl();

spellChecker.saveToDictionary('halo');
spellChecker.setCaseSensitive(false);
spellChecker.check('Halo world!').then(console.log); // Console Output: true

spellChecker.__destroy__(); // Remote instances cannot be automatically cleared by GC and need to be destroyed manually
```

For more examples, see [examples](https://github.com/vgerbot-libraries/tschannel/tree/master/packages/examples) and unit tests.

## LICENSE

The `@vgerbot/channel` library is released under the terms of the [![MIT License](https://badgen.net/github/license/y1j2x34/tschannel)](https://github.com/y1j2x34/tschannel/blob/master/LICENSE).
