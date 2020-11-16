export default function uid(template = 'xxxxxxxx') {
    return template.replace(/x/g, () => {
        const chr = Math.floor(Math.random() * 16).toString(16);
        if (Math.random() >= 0.5) {
            return chr;
        } else {
            return chr.toUpperCase();
        }
    });
}
