'use strict';

export function tokens(string) {
    return string.split(/[ _-]/);
}

export function camelize(string) {
    const tokenList = tokens(string);
    return tokenList[0] + tokenList.slice(1).map(token => token.substring(0, 1).toUpperCase() + token.substring(1)).join('');
}

export function spacialize(string) {
    return tokens(string).join(' ');
}

export function ucfirst(string) {
    return string.substring(0, 1).toUpperCase() + string.substring(1);
}