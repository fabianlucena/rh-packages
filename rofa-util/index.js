import * as util from 'util';
import * as uuid from 'uuid';

export const locale = {
        _f(string) {
            return string;
        },
        
        _fp(string, ...params) {
            return [string, ...params];
        },
        
        _nf(n, singular, plural, ...opt) {
            return [singular, plural, ...opt];
        },
        
        async _(string, ...opt) {
            return util.format(string, ...opt);
        },

        async _n(n, singular, plural, ...opt) {
            return util.format((n == 1)? singular: plural, ...opt);
        },

        async _or(...list) {
            if (list.length < 2)
                return list[0];
            
            return list.slice(0, -1).join(', ') + ', or ' + list.pop();
        },

        async _and(...list) {
            if (list.length < 2)
                return list[0];
            
            return list.slice(0, -1).join(', ') + ', and ' + list.pop();
        },
    },
    l = locale;

export function setUpError(error, options) {
    let arranged = {};
    for (const name in options) {
        const value = options[name];
        if (name == 'message' || name == 'statusCode' || error.constructor?.NoObjectValues?.includes(name)) {
            if (typeof value === 'object' && !(value instanceof Array)) {
                arranged = {...arranged, ...value};
                continue;
            }
        }

        arranged[name] = value;
    }

    for (const k in arranged)
        error[k] = arranged[k];
}

export class _Error extends Error {
    static VisibleProperties = ['message'];

    constructor(message, ...params) {
        super();
        setUpError(
            this,
            {
                _message: message,
                params
            }
        );
    }
}

export class CheckError extends Error {
    static VisibleProperties = ['message'];

    constructor(message, options, ...params) {
        super();
        setUpError(
            this,
            {
                message: message,
                options: options,
                params: params
            }
        );
    }
}

export class MissingParameterError extends Error {
    static NoObjectValues = ['missingParameters'];
    static VisibleProperties = ['message', 'missingParameters'];
    static _zeroMessage = l._f('Mising parameters.');
    static _message = l._nf(0, 'Mising parameter: "%s".', 'Mising parameters: "%s".');

    statusCode = 400;
    missingParameters = [];
    
    constructor(...missingParameters) {
        super();
        setUpError(
            this,
            {
                missingParameters
            }
        );
    }

    _n() {return this.missingParameters.length;}

    async getMessageParamsAsync(locale) {
        return [await locale._and(...this.missingParameters)];
    }
}

export class MergeTypeError extends Error {
    static NoObjectValues = ['dstType', 'srcType'];
    static VisibleProperties = ['message'];
    static _message = l._f('Cannot merge into "%s" a "%s".');

    constructor(dstType, srcType) {
        super();
        setUpError(
            this,
            {
                dstType: dstType,
                srcType: srcType,
            }
        );
    }

    async getMessageParamAsync(locale) {  // eslint-disable-line no-unused-vars
        return [this.dstType, this.srcType];
    }
}

export function localeMiddleware(req, res, next) {
    req.locale = locale;
    next();
}

export function log(msg) {
    console.log(msg);
}

export function checkNull(obj, errMsj) {
    if (obj)
        throw errMsj;
}

export function checkNotNull(obj, errMsj) {
    if (obj)
        return obj;

    throw errMsj;
}

export function check(ok, options) {
    if (typeof options === 'string')
        options = {message: options};

    const result = options?.method?
        options.method(ok):
        ok;

    if (result)
        return ok;
    
    throw new CheckError(options);
}

export async function checkAsync(ok, options) {
    return check(ok, options);
}

export function validateUUID(value, paramName, options) {
    if (!options)
        options = {};

    if (!options.statusCode)
        options.statusCode = 500;
        
    if (!options.method)
        options.method = uuid.validate;

    if (!options._message)
        options._message = ['%s is not a valid UUID value', paramName];

    return check(value, options);
}

export function checkParameter(value, ...paramName) {
    if (!value)
        throw new MissingParameterError(...paramName);

    const missing = [];
    for (let i = 0, e = paramName.length; i < e; i++)
        if (value[paramName[i]] === undefined)
            missing.push(paramName[i]);

    if (missing.length)
        throw new MissingParameterError(...missing);

    return value[paramName];
}

export function checkParameterUUID(value, paramName) {
    value = checkParameter(value, paramName);
    return validateUUID(value, paramName, {statusCode: 400});
}

export async function getTranslatedParamsAsync(params, all, locale) {
    if (all) {
        return Promise.all(await params.map(async param => {
            if (param instanceof Array)
                return await locale._(...param);
            else
                return await locale._(param);
        }));
    } else {
        return Promise.all(await params.map(async param => {
            if (param instanceof Array)
                return await locale._(...param);
            else
                return param;
        }));
    }
}

export async function getErrorMessageParamsAsync(error, locale) {
    if (error.getMessageParamsAsync)
        return await error.getMessageParamsAsync(locale) || [];

    let _params = error._params;
    if (!_params) {
        let params = error.params;
        if (params)
            return await getTranslatedParamsAsync(params, false, locale);

        _params = error.constructor._params;
        if (!_params)
            return error.constructor.params || [];
    }

    return await getTranslatedParamsAsync(_params, true, locale);
}

export async function getErrorMessageAsync(error, locale) {
    let message;
    if (error.getMessageAsync) {
        message = await error.getMessageAsync(locale);
        if (message)
            return message;
    }

    let _message = error._message;
    if (!_message) {
        let message = error.message;
        if (!message)
            _message = error.constructor._message;

        if (!_message) {
            if (!message) {
                message = error.constructor.message;
                if (!message)
                    return;
            }

            let params;
            if (error.message instanceof Array) {
                params = await getTranslatedParamsAsync(message.slice(1), false, locale);
                message = message[0];
            } else
                params = await getErrorMessageParamsAsync(error, locale);

            return util.format(message, params);
        }
    }

    // Only singular messages
    if (!(_message instanceof Array) || _message.length < 2 || !error._n) {
        let params;
        if (_message instanceof Array) {
            const _params = _message.slice(1);
            _message = _message[0];

            if (_params)
                params = await getTranslatedParamsAsync(_params, true, locale);
        }
        else
            params = await getErrorMessageParamsAsync(error, locale);

        return locale._(_message, ...params);
    }
    
    // For singular/plural messages
    let _n = (typeof error._n === 'function')?
        error._n():
        error._n;

    if (!_n) {
        if (error._zeroMessage)
            _message = error._zeroMessage;
        else if (error.zeroMessage)
            message = error.zeroMessage;
        else if (!error._message) {
            if (error.constructor._zeroMessage)
                _message = error.constructor._zeroMessage;
            else
                message = error.constructor.zeroMessage;
        }

        if (_message) {
            if (_message instanceof Array) {
                params = await getTranslatedParamsAsync(_message.slice(1), false, locale);
                _message = message[0];
            } else
                params = await getErrorMessageParamsAsync(error, locale);

            return locale._(_message, params);
        }

        if (message) {
            if (message instanceof Array) {
                params = await getTranslatedParamsAsync(message.slice(1), false, locale);
                message = message[0];
            } else
                params = await getErrorMessageParamsAsync(error, locale);

            return util.format(message, params);
        }

        return;
    }
    
    let _singular = _message[0],
        _plural = _message[1],
        _params = _message.slice(2),
        params;

    if (_params && _params.length > 0)
        params = await getTranslatedParamsAsync(_params, true, locale);
    else if (error.getMessageParamsAsync)
        params = await error.getMessageParamsAsync(locale) || [];
    else
        params = await getErrorMessageParamsAsync(error, locale);

    return locale._n(_n, _singular, _plural, ...params);
}

export async function getErrorDataAsync(error, locale) {
    let data = {};
    if (error instanceof Error) {
        data.name = error.constructor.name;
        if (data.name[0] == '_')
            data.name = data.name.substring(1);

        const visibleProperties = error.constructor?.VisibleProperties ?? ['message', 'length', 'fileName', 'lineNumber', 'columnNumber', 'stack'];
        visibleProperties.forEach(n => data[n] = error[n]);

        if (error.statusCode)
            data.statusCode = error.statusCode;

        data.message = await getErrorMessageAsync(error, locale);
    } else
        data.message = error;

    if (!data.error)
        data.error = data.name || data.message || 'Error';

    return data;
}

export async function errorHandlerAsync(error, locale, showInConsole) {
    const data = await getErrorDataAsync(error, locale ?? l);
    const logTitle = data.name? data.name + ': ': '';

    if (showInConsole || showInConsole === undefined) {
        console.error(logTitle + data.message);
        if (error.stack)
            console.error(error.stack);
    }

    return data;
}

export function tokens(string) {
    return string.split(/[ _-]/);
}

export function camelize(string) {
    const tokenList = tokens(string);
    return tokenList[0] + tokenList.slice(1).map(token => token.substring(0, 1).toUpperCase() + token.substring(1)).join('');
}

/**
 * Merge the objects source and destiny. The result is the merged object. But, if the replace option is defined the destiny object is updated.
 * @param {object} dst - destiny
 * @param {object} src - source
 * @param {Options} options - merging options. It's can be a array in this case merge only the specified properties.
 *  - properties {array} - list of properties to merge.
 *  - replace {boolean} - if it's true the destiny object is updated with the source values.
 *  - deep {number} - if it's defined and other than zero object values are merged too, until the epecified level.
 *  - skipExistent {bool} - if it's true the destiny values are no overriden.
 * @returns {object} - the merged object.
 */
export function merge(dst, src, options) {
    if (!src)
        return dst;

    if (src instanceof Array) {
        if (!dst)
            dst = [];
        else if (!(dst instanceof Array))
            throw new MergeTypeError(typeof dst, typeof src);

        let result;
        if (options?.replace)
            result = dst;
        else
            result = [...dst];

        if (options?.deep) {
            const deepOptions = merge(options, {});
            if (deepOptions.deep > 0)
                deepOptions.deep--;
                
            for (let i = 0, e = src.length; i < e; i++) {
                let v = src[i];
                if (v && typeof v === 'object')
                    if (v instanceof Array)
                        v = merge([], v, deepOptions);
                    else
                        v = merge({}, v, deepOptions);

                result.push(v);
            }
        } else
            result.push(...src);

        return result;
    }

    if (!dst)
        dst = {};
    else if (dst instanceof Array) {
        throw new MergeTypeError(typeof dst, typeof src);
    }

    let properties;
    if (options instanceof Array) {
        properties = options;
        options = {};
    }
    else
        properties = options?.properties;
        
    if (properties === undefined)
        properties = Object.keys(src);

    let result;
    if (options?.replace)
        result = dst;
    else {
        result = {};
        for (const k in dst)
            result[k] = dst[k];
    }

    if (options?.deep) {
        const deepOptions = merge(options, {});
        if (deepOptions.deep > 0)
            deepOptions.deep--;

        for(let i = 0, e = properties.length; i < e; i++) {
            const p = properties[i];
            let isSrcObject = typeof src[p] === 'object';
            let v;

            if (dst[p] === undefined) {
                if (isSrcObject)
                    if (src[p] instanceof Array)
                        v = merge([], src[p], deepOptions);
                    else
                        v = merge({}, src[p], deepOptions);
                else
                    v = src[p];
            } else {
                let isDstObject = typeof dst[p] === 'object';

                if (isDstObject)
                    if (isSrcObject && deepOptions.deep)
                        v = merge(dst[p], src[p], deepOptions);
                    else if (options?.skipExistent)
                        v = dst[p];
                    else
                        v = src[p];
                else if (options?.skipExistent)
                    v = dst[p] || src[p];
                else
                    v = src[p] || dst[p];
            }

            result[p] = v;
        }
    } else if (options?.skipExistent) {
        for(let i = 0, e = properties.length; i < e; i++) {
            const p = properties[i];
            result[p] = dst[p] ?? src[p];
        }
    } else {
        for(let i = 0, e = properties.length; i < e; i++) {
            const p = properties[i];
            result[p] = src[p] ?? dst[p];
        }
    }
    
    return result;
}

/**
 * Deep version for the merge method. @see compelte method.
 * @param {object} dst - destiny
 * @param {object} src - source
 * @param {Options} options - merge options @see merge method.
 * @returns {object} - the destiny
 */
export function deepMerge(dst, src) {
    return merge(dst, src, {deep: -1});
}

/**
 * Complete the properties of the destiny object whit the source object. If the destiny object is null or undefined returns a new object whit the source values.
 * @param {object} dst - destiny
 * @param {object} src - source
 * @param {Options} options - merge options @see merge method.
 * @returns {object} - the destiny
 */
export function complete(dst, src, options) {
    return merge(dst, src, merge(options, {skipExistent: true, replace: true}));
}

/**
 * Deep version for the complete method. @see compelte method.
 * @param {object} dst - destiny
 * @param {object} src - source
 * @param {Options} options - merge options @see merge method.
 * @returns {object} - the destiny
 */
export function deepComplete(dst, src, options) {
    return merge(dst, src, merge(options, {skipExistent: true, replace: true, deep: -1}));
}

/**
 * Replace the values of properties of destiny with the source properties values.
 * @param {object} dst - destiny
 * @param {object} src - source
 * @param {Options} options - merge options @see merge method.
 * @returns {object} - the destiny
 */
export function replace(dst, src, options) {
    return merge(dst, src, merge(options, {replace: true}));
}