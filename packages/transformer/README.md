# @vgerbot/channel-transformer

A typescript transformer, which is used to simplify the use of the [@vgerbot/channel](https://npmjs.com/packages/@vgerbot/channel) library.
It has the following conversion features:

- Convert the members of the interface passed to the `get_class` method to an array:

  ```ts
  // Automatically the generate class id
  interface RmAPI {
      method();
  }

  // before:
  chnl.get_class<RmAPI>();
  // after transformed:
  var RmAPIMembers1 = ['method'];
  chnl.get_class('RmAPI', RmAPIMembers1);
  ```
  ```ts
  // Use Interface name as class Id
  interface RmAPI {
    method();
  }

  // before
  chnl.get_class<RmAPI>('other-RmAPI');
  // after
  var RmAPIMembers1 = ['method'];
  chnl.get_class('other-RmAPI', RmAPIMembers1);
  ```

- Auto-generated class id and passed to `def_class` method:

  ```ts
  class ClassA {}
  // before
  chnl.def_class(ClassA);
  // after
  chnl.def_class('ClassA', ClassA);
  ```
  ```ts
  interface API {
      method();
  }
  class APIImpl implements API{
      method() {}
  }
  // before
  chnl.def_class(APIImpl);
  // after
  chnl.def_class('APIImpl', APIImpl);
  ```

- Auto-generated method id and passed to `def_method` method:

  ```ts
  // before
  chnl.def_method(function named_method() {});
  // after
  chnl.def_method('named_method', function named_method() {});
  ```
  ```ts
  function named_method() {}
  // before
  chnl.def_method(named_method);
  // after
  chnl.def_method('named_method', named_method);
  ```
  ```ts
  const named_method = () => {};
  // before
  chnl.def_method(named_method);
  // after
  chnl.def_method('named_method', named_method);
  ```

For more examples, please refer to Unit Tests and Snapshots.

## Requirement

Typescript >= 3.2.2

## Setup

### Webpack(with ts-loader or awesome-typescript-loader)

```js
// webpack.config.js
const tschannelTransformer = require('@vgerbot/channel-transformer').default;
module.exports = {
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

tsconfig.json

```json
{
    "compilerOptions": {
        "plugins": [{
            "transform": "@vgerbot/channel-transformer"
        }]
    }
}
```

## License

[![License MIT](https://badgen.net/github/license/y1j2x34/tschannel)](https://github.com/y1j2x34/tschannel/blob/master/LICENSE)
