const path = require('path');
const fs = require('fs');
const child_process = require('child_process');

const exampleName = process.argv[2];
if(!exampleName) {
    raiseError('Missing example name, you should run the example like this: npm start iframe');
}
const exampleDir = path.resolve(__dirname, exampleName);

if(!fs.existsSync(exampleDir)) {
    raiseError('Example not exists: ' + exampleName);
}

child_process.execSync(`parcel serve ./${exampleName}/src/**/*.html -p 8888`, {
    stdio: [0,1,2]
});


function raiseError(message) {
    console.error(message);
    process.exit(1);
}
