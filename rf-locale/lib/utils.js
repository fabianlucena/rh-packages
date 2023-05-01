'use strict';

import fs from 'fs';

export function tokens(text) {
    return text.split(/[ _-]/);
}

export function camelize(text) {
    const tokenList = tokens(text);
    return tokenList[0] + tokenList.slice(1).map(token => token.substring(0, 1).toUpperCase() + token.substring(1)).join('');
}

export function pascalize(text) {
    text = camelize(text);
    return text[0].toUpperCase() + text.substring(1);
}

export function isEnquoted(text, quotes) {
    if (!quotes)
        quotes = ['"', '\'', '`'];

    return (text.length > 1)
        && text[0] === text[text.length - 1]
        && quotes.includes(text[0]);
}

export function stripQuotes(text, quotes) {
    if (!isEnquoted(text, quotes))
        return;

    return text.substring(1, text.length - 1);
}

export function loadJson(fileName, options) {
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