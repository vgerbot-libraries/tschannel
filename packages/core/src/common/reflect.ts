const DEFAULT_IGNORED_PROPERTIES = [
    'isProxy',
    'constructor',
    'hasOwnProperty',
    'isPrototypeOf',
    'propertyIsEnumerable',
    'toLocaleString',
    'toString',
    'apply',
    'arguments',
    'bind',
    'call',
    'caller',
    Symbol.hasInstance,
    'valueOf',
    '__defineGetter__',
    '__defineSetter__',
    '__lookupGetter__',
    '__lookupSetter__'
];

export function getDescriptors(prototype: object, ignores: string[] = []): { [p: string]: PropertyDescriptor } {
    const descriptors = _getClassDescriptors(prototype);
    DEFAULT_IGNORED_PROPERTIES.concat(ignores).forEach(name => {
        delete descriptors[name];
    });
    return descriptors;

    function _getClassDescriptors(prototype) {
        if (typeof prototype !== 'object' || prototype === null) {
            return {};
        }
        const superPrototype = Object.getPrototypeOf(prototype);
        const superDescriptors = superPrototype === prototype ? {} : _getClassDescriptors(superPrototype);
        return Object.assign(superDescriptors, Object.getOwnPropertyDescriptors(prototype));
    }
}

export function getPropertyNames(prototype: object, ignores: string[] = []) {
    return Object.keys(getDescriptors(prototype, ignores));
}
