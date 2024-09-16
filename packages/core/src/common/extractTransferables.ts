export function extractTransferables(data: unknown): Transferable[] {
    if (!data) {
        return [];
    }

    const transferables: Transferable[] = [];

    function findTransferables(value: unknown, visited: Set<unknown>) {
        if (visited.has(value)) {
            return;
        }
        visited.add(value);
        if (
            value instanceof ArrayBuffer ||
            value instanceof MessagePort ||
            value instanceof ImageBitmap ||
            value instanceof OffscreenCanvas
        ) {
            transferables.push(value);
        } else if (Array.isArray(value)) {
            value.forEach(it => findTransferables(it, visited));
        } else if (value && typeof value === 'object') {
            for (const key in value) {
                findTransferables((value as Record<string, unknown>)[key], visited);
            }
        }
    }

    findTransferables(data, new Set());

    return transferables;
}
