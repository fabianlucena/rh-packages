import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

function getTrace() {
    const trace = (new Error()).stack
        .split(/(\r|\n)/)
        .map(l => l.trim())
        .filter(l => l)
        .filter(l => l.startsWith('at '))
        .slice(1)
        .map(l => {
            const res = {};
            l = l.substring(3);
            if (l.startsWith('async ')) {
                res.async = true;
                l = l.substring(6);
            }

            let match = /^([^ ]+) \(/.exec(l);
            if (match) {
                res.function = match[1];
                l = l.substring(res.function.length + 1);

                if (l.startsWith('(') && l.endsWith(')')) {
                    l = l.substring(1, l.length - 1);
                }
            }

            match = /^(.+):(\d+):(\d+)$/.exec(l);
            if (match) {
                res.url = match[1];
                res.line = match[2];
                res.col = match[3];
            }

            return res;
        });

    return trace;
}

function fileUrlToPath(url) {
    let path = fileURLToPath(url);
    if (path.match(/^[\w]:/)) {
        path = path.substring(2);
    }

    return path;
}

export async function importFrom(options) {
    options ??= {};

    let exlude = [...(options?.exlude ?? [])];
    let dir = options.dir;
    let addToExclude;
    if (!dir) {
        let filename = options.filename;
        if (!filename) {
            let url = options.url;
            if (!url) {
                url = getTrace().slice(1)[0].url;
                addToExclude = true;
            }

            filename = fileUrlToPath(url);
        }

        dir = '.' + path.sep;

        if (addToExclude) {
            let basename = path.basename(filename);
            exlude.push(basename);
        }
    }

    dir = path.join(dir);
    if (dir[0] !== path.sep && dir[0] !== '.') {
        dir = '.' + path.sep + dir;
    }

    let baseDir = fileUrlToPath(getTrace().slice(1)[0].url);
    baseDir = path.dirname(baseDir) + path.sep;

    let currentDir = fileUrlToPath(import.meta.url);
    currentDir = path.dirname(currentDir) + path.sep;

    let relativeCwdDir = path.relative(process.cwd(), path.join(baseDir, dir));
    if (!relativeCwdDir) {
        relativeCwdDir = '.' + path.sep;
    }

    const files = fs
        .readdirSync(relativeCwdDir)
        .filter(file => file.endsWith('.js') && !exlude.includes(file));

    if (!files.length) {
        return [];
    }

    let relativeDir = path.relative(currentDir, path.join(baseDir, dir));
    if (!relativeDir) {
        relativeDir = '.' + path.sep;
    }

    if (path.sep === '\\') {
        relativeDir = relativeDir.replace(/\\/g, '/');
    }

    if (!relativeDir.endsWith(path.sep)) {
        relativeDir += path.sep;
    }

    const imported = [];
    for (const file of files) {
        let thisImported = import(relativeDir + file);
        if (options.await) {
            thisImported = await thisImported;
        }

        imported.push(thisImported);
    }

    return imported;
}