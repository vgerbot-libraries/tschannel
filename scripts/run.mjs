import { getWorkspaceName } from "./workspace-name.mjs";

const command = argv._[0];

const workspaceName = getWorkspaceName(1);

if (workspaceName !== "all") {
    await $`yarn workspace ${workspaceName} ${command}`;
} else {
    await $`yarn workspace @vgerbot/channel ${command}`;
}
