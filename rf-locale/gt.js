'use strict';

import fs from 'fs';
import {glob} from 'glob';

const options = {};
const args = process.argv.slice(2);
const paths = [];
for (let i = 0, e = args.length; i < e; i++) {
    const arg = args[i];
    if (arg === '--ignore') {
        i++;
        options.ignore = args[i];
    } else
        paths.push(arg);
}

let sources = [];
let extractOptions = {
    patterns: ['_', '_f', '_fp', '_nf', '_', '_n', '_d', '_nd'],
    pluralsPatterns: ['_nf', '_nd', '_n'],
    domainedPatterns: ['_d', '_nd'],
};

await Promise.all(paths.map(async path => {
    const files = await glob(path, options);
    for (let i in files)
        sources = [...sources, ...(extractSourcesFromFile(files[i], extractOptions).sources)];
}));

function extractSourcesFromFile(file, options) {
    const code = fs.readFileSync(file, 'utf8');
    return extractSourcesFromCode(code, {sourceData: {file}, ...options});
}

function extractSourcesFromCode(code, options) {
    if (!options)
        options = {};

    options.end ??= code.length;
    options.index ??= 0;
    options.line ??= 1;
    options.linePos ??= 0;
    options.closer ??= null;
    options.newLineCloser ??= false;
    options.extract ??= true;
    options.sources ??= [];
    options.patterns ??= ['_', '_f', '_fp', '_nf', '_', '_n', '_d', '_nd'];
    options.pluralsPatterns ??= ['_nf', '_nd', '_n'];
    options.domainedPatterns ??= ['_d', '_nd'];
    
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

            options.index++;
            options = extractSourcesFromCode(code, {...options, closer: char, extract: false});
            options.extract = extract;
            options.closer = closer;
            options.index++;

            continue;
        }

        case '/': {
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
            for (let p in options.patterns) {
                const patternName = options.patterns[p];
                const pattern = new RegExp('^(' + patternName + '\\s*)\\(');
                const match = pattern.exec(code.substring(options.index));
                if (match) {
                    const snippetFrom = options.index;

                    options.index += match[0].length;

                    const closer = options.closer;
                    const extract = options.extract;
                    const parasmsFrom = options.index;
        
                    options = extractSourcesFromCode(code, {...options, closer: ')', extract: false});
                    options.extract = extract;
                    options.closer = closer;
                    const paramsTo = options.index;
                    options.index++;

                    const snippet = code.substring(snippetFrom, paramsTo + 1).trim();
                    const paramsSnippet = code.substring(parasmsFrom, paramsTo).trim();

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

                    let source;
                    let domain;
                    let offset = 0;
                    if (options.domainedPatterns.includes(patternName)) {
                        domain = allParams[offset];
                        offset++;
                    }

                    if (options.pluralsPatterns.includes(patternName))
                        source = [allParams[offset + 1], allParams[offset + 2]];
                    else
                        source = [allParams[offset]];

                    options.sources.push({
                        source,
                        domain,
                        ...options.sourceData,
                        function: match[1].trim(),
                        line: options.line,
                        column: options.index - options.linePos + 1,
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

console.log(sources);