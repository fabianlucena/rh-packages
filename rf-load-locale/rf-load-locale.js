'use strict';

import url from 'url';
import path from 'path';
import fs from 'fs';

function merge(dst, src) {
    for (var p in src) {
        try {
            if (src[p].constructor == Object)
                dst[p] = merge(dst[p], src[p]);
            else
                dst[p] = src[p];
        } catch(e) {
            dst[p] = src[p];
        }
    }

    return dst;
}

export async function loadLocale(language) {
    const parts = language.split('-');
    let locale;
    if (parts.length > 1)
        locale = await loadLocale(parts[0]);
    else
        locale = {};
    
    try {
        const dirName = path.dirname(url.fileURLToPath(import.meta.url)) + `/locale/${language}/`;

        if (!fs.existsSync(dirName))
            return;

        await Promise.all(
            fs.readdirSync(dirName)
                .map(async fileName => {
                    if (fileName.endsWith('.json')) {
                        const fullFileName = dirName + fileName;
                        const jsonData = fs.readFileSync(fullFileName, { encoding: 'utf8', flag: 'r' });
                        const data = JSON.parse(jsonData);
                        const moreLocale = {};
                        moreLocale[fileName.slice(0, -5)] = data;
                        merge(locale, moreLocale);
                    }
                })
        );

        return locale;
    } catch(e) { console.error(e); }

    return false;
}