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

const command = fs.readFileSync(`./${exampleName}/start.sh`).toString('utf8');

child_process.execSync(command, {
    stdio: [0,1,2]
});


function raiseError(message) {
    console.error(message);
    process.exit(1);
}
