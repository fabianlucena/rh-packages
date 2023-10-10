'use strict';

export function tokens(text) {
    return text.split(/[ _-]/);
}

export function camelize(text) {
    const tokenList = tokens(text);
    return tokenList[0] + tokenList.slice(1).map(token => token.substring(0, 1).toUpperCase() + token.substring(1)).join('');
}

export function spacialize(text) {
    return tokens(text).join(' ');
}

export function ucfirst(text) {
    return text.substring(0, 1).toUpperCase() + text.substring(1);
}

export function lcfirst(text) {
    return text.substring(0, 1).toLowerCase() + text.substring(1);
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

export function format(text, ...params) {
    let i = 0;
    let end = params?.length ?? 0;
    while (text.match('%s') && i < end) {
        text = text.replace('%s', params[i]);
        i++;
    }

    return text;
}

export function trim(data) {
    if (typeof data === 'string') {
        return data.trim();
    } else if (typeof data === 'object') {
        for (const k in data) {
            data[k] = trim(data[k]);
        }
    }

    return data;
}