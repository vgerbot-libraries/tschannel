# @vgerbot/channel ![tschannel workflow](https://github.com/y1j2x34/channel-ts/actions/workflows/runtest.yml/badge.svg) [![codecov](https://codecov.io/gh/vgerbot-libraries/tschannel/branch/master/graph/badge.svg?token=fPomBmOknB)](https://codecov.io/gh/vgerbot-libraries/tschannel)

---

这是一个由 Typescript 实现的消息传递抽象层，他的目的是封装消息传递的细节，让 js 能够构造存在于不同上下文的类以及像调用普通异步方法一般调用不同上下文的方法。

## 功能

1. 封装：封装通信细节，提供一致上层API
2. 隔离：数据被安全地隔离在不同的 channel-id 中。
3. API：惯用的API，远程调用和普通异步调用一样简单，支持回调函数，异常处理和普通异步方法一致
4. 并行：支持分解任务到多个目标上下文并行执行
5. 扩展：支持自定义 communicator 以支持更多通信方式

## 开始使用

### 安装依赖和环境搭建

```sh
npm i -s @vgerbot/channel
```

为了能够更方便地使用 channel API, 在开始之前， 先安装 [`@vgerbot/channel-transformer`](https://www.npmjs.com/package/@vgerbot/channel-transformer), 其具体如何配置方法可以npm或者github仓库上的 README 文档说明。

```sh
npm i -D @vgerbot/channel-transformer
```

transformer 用法参考 <../packages/transformer/README.md>

### 示例及用法

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

const performCPUIntensiveCalculation = chnl.get_method('performCPUIntensiveCalculation');
performCPUIntensiveCalculation().then(console.log) // Console Output: "Result!"

const DefaultSpellCheckerImpl = chnl.get_class<SpellChecker>('DefaultSpellCheckerImpl');

const spellChecker = new DefaultSpellCheckerImpl();

spellChecker.saveToDictionary('halo');
spellChecker.setCaseSensitive(false);
spellChecker.check('Halo world!').then(console.log); // Console Output: true

spellChecker.__destroy__(); // 远程实例无法被GC清除，需要手动销毁。
```

更多示例参考 <./packages/examples> 和单元测试

## 许可证

`@vgerbot/channel` 库是根据 MIT 许可证的条款发布的。
