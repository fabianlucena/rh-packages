'use strict';

import fs from 'fs';

export function extractSourcesFromFile(file, options) {
    const code = fs.readFileSync(file, 'utf8');
    if (!options.sourceData)
        options.sourceData = {};

    options.sourceData.file = file;
    options.newFile = true;
    return extractSourcesFromCode(code, options);
}

/**
 * Exrtracs the text for translations from code.
 * Options is a object, avalizable opttions are:
 * - extract [true]: if true performs the extraction or not otherwise.
 * - sources [obkjects List]: list of extracted sources.
 * - patterns: map of patters to extract. See below for a help.
 * - newFile: if true resets the options for a new file.
 * - sourceData: data to copy en each element of the extractes sources, useful for put the filename.
 * - end: (for internal use) length of the code.
 * - index: (for internal use) current pos of the compiler.
 * - line: (for internal use) current line number.
 * - linePos: (for internal use) index position where the current line begins.
 * - closer: extract only until the closer appears, example: parentesis, quotes, close comments, etc.
 * - newLineCloser: extract only until the end of line.
 * 
 * Patterns specification:
 * It is a object, the key is the name of the function without the parentesis, the parentesis is added automatically. and the options for each extractor are:
 * - domainIndex: param index for the domain value if exists, use null or undefined for no use domain.
 * - nIndex: param index for the n value for plural forms if exists, use null or undefined for no use plural.
 * - sourceMap: it's a object indicating wich param is mapped into the source text. The key is the destiny index and the value is the index of param in the function.
 * 
 * Examples:
 *      Single: {'_': {sourceMap:{0:0}}} it's for use he function _(text, ...), as a single text, the parameter number zero is captured in the zero position. The rest of params are ignored.
 *      With domain: {'_d': {domainIndex: 0, sourceMap:{0:1}}} it's for use he function _d(domain, text, ...), as a single text but with tranlation domain, the parameter number zero is the domain name. Then parameter number one is captured in the zero position.
 *      Plural form: {_n': {nIndex: 0, sourceMap:{0: null, 1: 1, 2: 2}}} it's for use he function _n(n, singular, plural, ...), the parameter number zero is the nIndex, the parameter number one is the singular text captured in the position number one, and the parameter number two is the plural text captured in the position number two. For the position zero (no elements form) use null.
 *      Plural form with no elements: {_nn': {nIndex: 0, sourceMap:{0: 1, 1: 2, 2: 3}}} it's for use he function _n(n, noItems, singular, plural, ...), the parameter number zero is the nIndex, the parameter number one is the no items text captured in the position number zero, the parameter number one is the singular text captured in the position number one, the parameter number two is the plural text captured in the position number two.
 */
export function extractSourcesFromCode(code, options) {
    if (!options)
        options = {};

    options.extract ??= true;
    options.sources ??= [];
    options.patterns ??= {
        '_': {sourceMap: {0:0}},
        '_f': {sourceMap: {0:0}},
        '_d': {domainIndex: 0, sourceMap: {0:1}},
        '_n': {nIndex: 0, sourceMap: {0: null, 1: 1, 2: 2}},
        '_nn': {nIndex: 0, sourceMap: {0: 1, 1: 2, 2: 3}},
        '_nf': {nIndex: 0, sourceMap: {0: null, 1: 1, 2: 2}},
        '_nnf': {nIndex: 0, sourceMap: {0: 1, 1: 2, 2: 3}},
        '_nd': {domainIndex: 0, nIndex: 1, sourceMap: {0: null, 1: 2, 2: 3}},
        '_nnd': {domainIndex: 0, nIndex: 1, sourceMap: {0: 2, 1: 3, 2: 4}},
    };
    if (options.newFile) {
        options.newFile = false;
        options.end = code.length;
        options.index = 0;
        options.line = 1;
        options.linePos = 0;
        options.closer = null;
        options.newLineCloser = false;
    } else {
        options.end ??= code.length;
        options.index ??= 0;
        options.line ??= 1;
        options.linePos ??= 0;
        options.closer ??= null;
        options.newLineCloser ??= false;
    }
    
    let newLineSkip = false;
    while (options.index < options.end) {
        let char = code[options.index];

        if (char === '\r')
            newLineSkip = '\n';
        else if (char === '\n')
            newLineSkip = '\r';

        if (newLineSkip) {
            options.line++;
            options.index++;

            const n = options.index;
            if (n < options.end) {
                const next = code[n];
                if (next == newLineSkip)
                    options.index++;
            }

            options.linePos = options.index;

            if (options.newLineCloser)
                return options;

            newLineSkip = false;
            continue;
        }

        if (options.closer && options.closer[0] == char) {
            if (options.closer.length === 1)
                return options;

            const k = options.index + options.closer.length;
            if (k < options.end && code.substring(options.index, k) === options.closer)
                return options;
        }

        switch (char) {
        case '\\':
            options.index += 2;
            continue;

        case ' ' :
        case '\t':
        case '\v':
            options.index++;
            continue;

        case '"':
        case '\'':
        case '`': {
            const closer = options.closer;
            const extract = options.extract;
            const skipCommentDelimiters = options.skipCommentDelimiters;

            options.index++;
            options = extractSourcesFromCode(code, {...options, closer: char, extract: false, skipCommentDelimiters: true});
            options.skipCommentDelimiters = skipCommentDelimiters;
            options.extract = extract;
            options.closer = closer;
            options.index++;

            continue;
        }

        case '/': {
            if (options.skipCommentDelimiters)
                break;

            options.index++;
            if (options.index >= options.end)
                continue;

            const next = code[options.index];
            const newOptions = {...options};

            if (next === '*')
                newOptions.closer = '*/';
            else if (next === '/')
                newOptions.newLineCloser = true;
            else
                continue;

            newOptions.index++;
                      
            const closer = options.closer;
            const newLineCloser = options.newLineCloser;
            const extract = options.extract;
            options = extractSourcesFromCode(code, newOptions);
            options.closer = closer;
            options.newLineCloser = newLineCloser;
            options.extract = extract;
            options.index++;

            continue;
        }
        }

        if (options.extract) {
            // console.log(code.substring(options.index, options.index + 160).replace(/\r/g, '\\r').replace(/\n/g, '\\n'));     
            for (let patternName in options.patterns) {
                const patternRegExp = new RegExp('^(' + patternName + '\\s*)\\(');
                const match = patternRegExp.exec(code.substring(options.index));
                if (match) {
                    const snippetFrom = options.index;

                    options.index += match[0].length;

                    const closer = options.closer;
                    const extract = options.extract;
                    const paramsFrom = options.index;
        
                    options = extractSourcesFromCode(code, {...options, closer: ')', extract: false});
                    options.extract = extract;
                    options.closer = closer;
                    const paramsTo = options.index;
                    options.index++;

                    const snippet = code.substring(snippetFrom, paramsTo + 1).trim();
                    const paramsSnippet = code.substring(paramsFrom, paramsTo).trim();

                    let paramIndex = 0;
                    let allParams = [];
                    let paramsOptions = {
                        closer: ',',
                        extract: false
                    };
                    do {
                        paramsOptions = extractSourcesFromCode(paramsSnippet, paramsOptions);
                        allParams.push(paramsSnippet.substring(paramIndex, paramsOptions.index).trim());
                        paramsOptions.index++;
                        paramIndex = paramsOptions.index;
                    } while (paramsOptions.index < paramsOptions.end);

                    const pattern = options.patterns[patternName];

                    let domain = null;
                    if (pattern.domainIndex || pattern.domainIndex === 0)
                        domain = allParams[pattern.domainIndex];

                    let n = null;
                    if (pattern.nIndex || pattern.nIndex === 0)
                        n = allParams[pattern.nIndex];

                    let error = null;
                    const source = [];
                    if (pattern.sourceMap) {
                        const sourceMap = pattern.sourceMap;
                        for (let destinyIndex in sourceMap) {
                            const sourceIndex = sourceMap[destinyIndex];
                            if (sourceIndex || sourceIndex === 0) {
                                if (sourceIndex < allParams.length)
                                    source[sourceIndex] = allParams[sourceIndex];
                                else {
                                    error = 'Not enough parameters to extract.';
                                }
                            }
                            else
                                source[sourceIndex] = null;
                        }
                    }

                    const column = options.index - options.linePos + 1;
                    const ref = `${options?.sourceData?.file ?? '<UNKNOWN FILE>'} [${options.line},${column}]`;

                    options.sources.push({
                        source,
                        domain,
                        ...options.sourceData,
                        function: match[1].trim(),
                        line: options.line,
                        column: column,
                        ref: ref,
                        error: error,
                        allParams,
                        snippet,
                        paramsSnippet,
                    });
                }
            }
        }

        options.index++;
    }

    return options;
}
