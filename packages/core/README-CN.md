# @vgerbot/channel ![tschannel workflow](https://github.com/y1j2x34/channel-ts/actions/workflows/runtest.yml/badge.svg) [![codecov](https://codecov.io/gh/vgerbot-libraries/tschannel/branch/master/graph/badge.svg?token=fPomBmOknB)](https://codecov.io/gh/vgerbot-libraries/tschannel)

---

这是一个由 Typescript 实现的消息传递抽象层，他的目的是封装消息传递的细节，让 js 能够构造存在于不同上下文的类以及像调用普通异步方法一般调用不同上下文的方法。

## 场景

1. 父页面调用 iframe 子页面的 js 方法
2. 主线程调用 web-worker 的方法
3. 主线程调用 web-worker 的方法，并且传递一个回调函数来接收进度信息
4. 一个 web-worker 调用另一个 web-worker 里面的方法
5. 客户端通过 websocket 调用 nodejs 服务端的方法
6. 主线程同时调用多个 web-worker 并行执行子任务后合并子任务返回结果

## 开始使用

### 安装依赖和环境搭建

```sh
npm i -s @vgerbot/channel
```

为了能够更方便地使用 channel API, 在开始之前， 先安装 [`@vgerbot/channel-transformer`](https://www.npmjs.com/package/@vgerbot/channel-transformer), 其具体如何配置方法可以npm或者github仓库上的 README 文档说明。

```sh
npm i -D @vgerbot/channel-transformer
```

### 调用‘远程’方法

```ts
// common.ts
export const CHANNEL_ID = 'my-cross-window-method-invocation-channel'
export const REMOTE_UPLOAD_METHOD = 'download-method-id';
export type UloadFileFunction = (file: ArrayBuffer, onprogress: (ratio: number) => void) => void;
```


```ts
// iframe.ts

import { channel } from '@vgerbot/channel';
import { CHANNEL_ID, UloadFileFunction, REMOTE_UPLOAD_METHOD } from './common';

const channelInstance = channel(CHANNEL_ID)
    .connectToOtherWindow(top)
    .create();

// 注册一个本地方法
channelInstance.def_method(REMOTE_UPLOAD_METHOD, (file: ArrayBuffer, onprogress: (ratio: number) => void) => {
    // 模拟文件上传
    for(let i=0;i<=100; i++) {
       onprogress(i / 100);
    }
})
```


```ts
import { channel } from '@vgerbot/channel';
import { CHANNEL_ID, UloadFileFunction, REMOTE_UPLOAD_METHOD } from './common';

const iframe = document.getElementById('nested-iframe');

const channelInstance = channel(CHANNEL_ID)
    .connectToOtherWindow(iframe.contentWindow)
    .create()

const remoteUloadFileFunction = channelInstance.get_method<UloadFileFunction>(REMOTE_UPLOAD_METHOD);
/*
 * remoteUloadFileFunction 相当于下面的类型：
 * (url: string) => Promise<void>
 *
 */
let buffer = /*ArrayBuffer*/
remoteUploadFileFunction(buffer, ratio => {
    console.log('Uploading ', ratio * 100 + '%')
})
    .then(() => {
        console.log('upload completed')
    })

```


### 创建‘远程’ class

```ts
// common.ts
export const CHANNEL_ID = 'my-cross-window-method-invocation-channel'
export const COMMON_API_CLASS_ID = 'common-api';
export interface CommonAPI {
    hello(): string;
}
```


```ts
// iframe.ts

import { channel } from '@vgerbot/channel';
import { CHANNEL_ID, COMMON_API_CLASS_ID, CommonAPI } from './common';

const channelInstance = channel(CHANNEL_ID)
    .connectToOtherWindow(top)
    .create();

class CommonAPIImpl implements CommonAPI {
    hello() {
        return 'world';
    }
}

// 注册一个本地 class
channelIntance.def_class(COMMON_API_CLASS_ID, CommonAPIImpl);
```


```ts
import { channel } from '@vgerbot/channel';
import { CHANNEL_ID, CommonAPI } from './common';

const iframe = document.getElementById('nested-iframe');

const channelInstance = channel(CHANNEL_ID)
    .connectToOtherWindow(iframe.contentWindow)
    .create()

const RemoteCommonAPI = channelInstance.get_class<CommonAPI>(COMMON_API_CLASS_ID);

// 上面的 RemoteCommonAPI 相当于是一实现了 IRemoteCommonAPI 的 class：
/*
* interface IRemoteCommonAPI {
*   hello(): Promise<string>;
*   __destroy__(): void;
* }
* */

const remoteCommonAPIInstance = new RemoteCommonAPI();

remoteCommonAPIInstance.hello().then(str => {
    console.log(str);
})
// 上面构造的示例 存储在 iframe 中，无法被 GC 自动清除，需要调用 __destroy__ 方法手动清除。
remoteCommonAPIInstance.__destroy__();
```

其它示例可以参考 test/specs 目录中的单元测试用例编写。

## 许可证

`@vgerbot/channel` 库是根据 MIT 许可证的条款发布的。

