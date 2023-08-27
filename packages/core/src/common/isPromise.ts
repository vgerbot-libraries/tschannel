export function isPromise<V>(value: unknown): value is Promise<V> {
    if (!value || typeof value !== 'object') {
        return false;
    }
    return isFunction(value['then']) && isFunction(value['catch']) && isFunction(value['finally']);
}
function isFunction<T>(value: T) {
    return typeof value === 'function' && value.toString().indexOf('class ') !== 0;
}
