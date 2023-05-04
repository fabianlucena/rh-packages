'use-strict';

import fs from 'fs';

export async function loadJson(fileName, options) {
    options ??= {};

    return new Promise((resolve, reject) => {
        if (!fs.existsSync(fileName)) {
            if (options.emptyIfNotExists)
                resolve({});
            else
                reject(new Error(`File ${fileName} does not exist`));
            
            return;
        }
        
        try {
            const content = fs.readFileSync(fileName, 'utf8');
            const data = JSON.parse(content);
            resolve(data);
        } catch(e) {
            reject(e);
        }
    });
}