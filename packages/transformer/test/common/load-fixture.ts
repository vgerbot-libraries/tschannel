import fs from 'fs';
import path from 'path';

const FIXTURES_DIR_PATH = path.resolve(__dirname, '../fixtures');

export interface Fixture {
    filepath: string;
    source: string;
}

export function loadFixtureByRelPath(relpath: string): Fixture {
    const filepath = `fixtures/${relpath}`;
    const source = fs.readFileSync(path.resolve(FIXTURES_DIR_PATH, relpath)).toString('utf8');
    return {
        filepath,
        source
    };
}

export function loadSpecialFixtures(filename: string): Fixture {
    const relpath = `special/${filename}.ts`;
    return loadFixtureByRelPath(relpath);
}

export function loadFixtures(): Fixture[] {
    const fixtureFiles = listDirTree(FIXTURES_DIR_PATH, (rootdir: string, relpath) => {
        return relpath !== 'special';
    });
    return fixtureFiles.map(it => loadFixtureByRelPath(it.rpath));
}

function listDirTree(rootdir: string, filter: (rootdir: string, relpath: string) => boolean) {
    const paths: Array<{ abspath: string; rpath: string }> = [];
    function _listDirTree(curpath: string, relpath: string) {
        fs.readdirSync(curpath).forEach(fitem => {
            const rpath = relpath === '' ? fitem : relpath + path.sep + fitem;
            if (!filter(rootdir, rpath)) {
                return;
            }
            const abspath = path.resolve(rootdir, rpath);
            if (fs.statSync(abspath).isDirectory()) {
                _listDirTree(abspath, rpath);
            } else {
                paths.push({
                    abspath,
                    rpath
                });
            }
        });
    }

    _listDirTree(rootdir, '');
    return paths;
}
