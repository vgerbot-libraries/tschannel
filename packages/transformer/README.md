# @vgerbot/channel-transformer

A typescript transformer that transforms the generic type parameters of the 'rclass' method to method parameters. It is used to simplify the use of tschannel

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

## License

[![License MIT](https://badgen.net/github/license/y1j2x34/tschannel)](https://github.com/y1j2x34/tschannel/blob/master/LICENSE)
