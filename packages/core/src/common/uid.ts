export default function uid(template = 'xxxxxxxx') {
    return template.replace(/x/g, () => {
        const chr = Math.floor(random() * 16).toString(16);
        if (random() >= 0.5) {
            return chr;
        } else {
            return chr.toUpperCase();
        }
    });
}
const u = new Uint32Array(1);
function random() {
    if (!crypto) {
        return Math.random();
    }
    const value = crypto.getRandomValues(u).at(0);
    if (typeof value === 'undefined') {
        return Math.random();
    }
    return value / 0xffffffff;
}
