export function tokens(text) {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .split(/([^a-zA-Z0-9]|(?<=[a-z])(?=[A-Z0-9])|(?<=[A-Z])(?=[0-9])|(?<=[0-9])(?=[a-zA-Z]))/)
        .map(t => t.trim().toLowerCase())
        .filter(t => t && t.match(/[a-zA-Z0-9]/));
}

export function camelize(text) {
    const tokenList = tokens(text);
    return tokenList[0] + tokenList.slice(1).map(token => token.substring(0, 1).toUpperCase() + token.substring(1)).join('');
}

export function underscorize(text) {
    return spacialize(text, '_');
}

export function spacialize(text, space) {
    space ??= ' ';
    return tokens(text).join(space);
}

export function ucfirst(text) {
    return text.substring(0, 1).toUpperCase() + text.substring(1);
}

export function lcfirst(text) {
    return text.substring(0, 1).toLowerCase() + text.substring(1);
}

export function isEnquoted(text, quotes) {
    if (!quotes) {
        quotes = ['"', '\'', '`'];
    }

    return (text.length > 1)
        && text[0] === text[text.length - 1]
        && quotes.includes(text[0]);
}

export function stripQuotes(text, quotes) {
    if (!isEnquoted(text, quotes)) {
        return;
    }

    return text.substring(1, text.length - 1);
}

export function format(text, ...params) {
    if (!text) {
        return text;
    }

    text = text.replace(/%%/g, '%');
    for (const replacement of params) {
        text = text.replace('%s', replacement);
    }

    return text;
}

export function trim(data, options) {
    options ??= {};
    options.deep ??= 10;

    if (!options.deep) {
        return data;
    }

    if (typeof data === 'string') {
        return data.trim();
    } else if (typeof data === 'object') {
        if (data instanceof Buffer) {
            return data;
        }

        for (const k in data) {
            data[k] = trim(data[k], {...options, deep: options.deep - 1});
        }
    }

    return data;
}