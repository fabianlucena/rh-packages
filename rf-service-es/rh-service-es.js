import {loadJson} from 'rf-util';
import url from 'url';
import path from 'path';

export function load() {
    const dirname = path.dirname(url.fileURLToPath(import.meta.url));
    return loadJson(dirname + '/translations_es.json');
}
