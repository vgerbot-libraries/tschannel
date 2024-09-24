import "zx/globals";

export function getWorkspaceName(argvIndex = 1) {
    switch (argv._[argvIndex]) {
        case "core":
            return "@vgerbot/channel";
        default:
            return "all";
    }
}
