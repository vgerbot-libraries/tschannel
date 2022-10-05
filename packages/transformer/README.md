# @vgerbot/channel-transformer

A typescript transformer, used to transform the interface type generic parameter on the `get_class` method to class and use it as a parameter.This greatly simplifies the use of the `@vgerbot/channel` library

## Requirement

Typescript >= 3.2.2

## Setup

### Webpack(with ts-loader or awesome-typescript-loader)

```js
// webpack.config.js
const tschannelTransformer = require('@vgerbot/channel-transformer').default;
module.exports {
    // ...
    module: {
        rules: [{
            test: /\.tsx?/,
            loader: 'ts-loader', // or 'awesome-typescript-loader'
            options: {
                getCustomTransformers:program => tschannelTransformer(program)
            }
        }]
    }
}
```

### Rollup(with rollup-plugin-typescript2)

```js
// rollup.config.js
import typescript from "rollup-plugin-typescript2";
const tschannelTransformer = require('@vgerbot/channel-transformer').default;
export default {
  // ...
  plugins: [
    typescript({
      transformers: [
        (languageService) => {
            const program = languageService.getProgram();
            return {
                before: [tschannelTransformer(program)]
            };
        }
      ]
    })
  ]
};
```

### ttypescript

```json
// tsconfig.json
{
    "compilerOptions": {
        // ...
        "plugins": [{
            "transform": "@vgerbot/channel-transformer"
        }]
    }
}
```

## Example

before:

```ts
import { channel } from '@vgerbot/channel';
const chnl = channel('channel-id')
    .connectToMainThread()
    .create();
chnl.get_class<RemoteAPI>();
chnl.def_method(function performCPUIntensiveCalculation() {})
interface RemoteAPI {
    method();
}
```

after:

```ts
import { channel } from '@vgerbot/channel';
var RemoteAPIMembers_1 = ['method'];

var chnl = channel('channel-id')
    .connectToMainThread()
    .create();

chnl.get_class('RemoteAPI', RemoteAPIMembers_1);

chnl.def_method('performCPUIntensiveCalculation', function performCPUIntensiveCalculation() {})
```

## License

[![License MIT](https://badgen.net/github/license/y1j2x34/tschannel)](https://github.com/y1j2x34/tschannel/blob/master/LICENSE)
