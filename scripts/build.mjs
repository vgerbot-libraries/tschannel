import { getWorkspaceName } from './workspace-name.mjs';

const workspaceName = getWorkspaceName();

if(workspaceName !== 'all') {
    await $`yarn workspace ${workspaceName} build`
} else {
    await $`yarn workspace @vgerbot/channel build`
    await $`yarn workspace @vgerbot/channel-transformer build`
}
