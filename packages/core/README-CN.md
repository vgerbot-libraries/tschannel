### @vgerbot/channel ![Build Status](https://github.com/y1j2x34/channel-ts/actions/workflows/runtest.yml/badge.svg) [![codecov](https://codecov.io/gh/vgerbot-libraries/tschannel/branch/master/graph/badge.svg?token=fPomBmOknB)](https://codecov.io/gh/vgerbot-libraries/tschannel)

`@vgerbot/channel` 是一个使用 TypeScript 实现的消息传递抽象层库，旨在简化不同上下文间的通信。它帮助开发者以一种简洁、惯用的方式，在不同环境（例如主线程和 Web Worker）中创建和调用类与方法。

## ✨ 核心特点

1. **封装性**：屏蔽底层通信细节，提供一致的高层 API。
2. **隔离性**：通过 `channel-id` 实现数据隔离，保证安全通信。
3. **简洁 API**：远程调用像普通异步函数一样简单，支持回调函数及一致的异常处理机制。
4. **并行执行**：支持将任务分解到多个目标上下文并行执行，提升性能。
5. **扩展性**：支持自定义通信器，便于扩展更多功能。

## 🚀 快速开始

### 📦 安装

使用 npm 安装该库：

```sh
npm install @vgerbot/channel
```

### 📘 示例代码

下面是一个简单的例子，展示了如何在主线程和 Web Worker 之间进行通信。

#### 定义接口 `api.ts`

```ts
export interface SpellChecker {
    saveToDictionary(word: string): void;
    setCaseSensitive(caseSensitive: boolean): void;
    check(sentence: string): boolean;
}
```

#### 在 Worker 中实现接口 `task.ts`

```ts
import { channel } from '@vgerbot/channel';
import { SpellChecker } from './api';

// 创建一个名为 'worker-channel' 的通道，并连接到主线程
const chnl = channel('worker-channel')
    .connectToMainThread()
    .create();

// 定义一个计算密集型方法
chnl.def_method(function performCPUIntensiveCalculation() {
    return 'Result!';
});

// 实现 SpellChecker 接口
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

#### 在主线程中调用 Worker `main.ts`

```ts
import { channel } from '@vgerbot/channel';
import { SpellChecker } from './api';

// 创建一个名为 'worker-channel' 的通道，并连接到 Worker
const chnl = channel('worker-channel')
    .connectToWorker('./task.js')
    .create();

// 调用 Worker 中定义的 CPU 密集型方法
const performCPUIntensiveCalculation = chnl.get_method<() => string>('performCPUIntensiveCalculation');
performCPUIntensiveCalculation().then(console.log); // 输出: "Result!"

// 获取 Worker 中的 SpellChecker 类
const DefaultSpellCheckerImpl = chnl.get_class<SpellChecker>('DefaultSpellCheckerImpl');

// 创建 SpellChecker 实例
const spellChecker = new DefaultSpellCheckerImpl();
spellChecker.saveToDictionary('halo');
spellChecker.setCaseSensitive(false);
spellChecker.check('Halo world!').then(console.log); // 输出: false

// 手动销毁远程实例，释放资源
spellChecker.__destroy__();
```

### 注意事项：

由于 JavaScript 的垃圾回收机制不能自动回收远程实例，建议在不再使用实例时调用 `__destroy__()` 方法，以防止内存泄漏。

更多示例请参考 [examples](https://github.com/vgerbot-libraries/tschannel/tree/master/packages/examples) 和单元测试。

## 🔧 支持的参数类型

`@vgerbot/channel` 支持所有可以通过结构化克隆算法（Structured Clone Algorithm）复制的数据类型。更多详情请参阅 [MDN 文档](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm)。

此外，该库还支持远程对象和回调函数作为参数，但这两类类型不能嵌套在其他对象中。

## 📜 许可证

`@vgerbot/channel` 基于 [MIT License](https://github.com/y1j2x34/tschannel/blob/master/LICENSE) 进行开源发布。
