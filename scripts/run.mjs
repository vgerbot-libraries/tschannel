import { getWorkspaceName } from './workspace-name.mjs';

const command = argv._[1];

const workspaceName = getWorkspaceName(2);

if(workspaceName !== 'all') {
    await $`yarn workspace ${workspaceName} ${command}`;
} else {
    await $`yarn workspace @vgerbot/channel ${command}`;
    await $`yarn workspace @vgerbot/channel-transformer ${command}`;
}
