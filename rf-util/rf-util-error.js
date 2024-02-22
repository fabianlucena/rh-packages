import {loc} from './rf-util-loc.js';
import {format} from './rf-util-string.js';

export function setUpError(error, options) {
    let arranged = {};
    for (const name in options) {
        const value = options[name];
        if (name == 'message' || name == 'statusCode' || error.constructor?.NoObjectValues?.includes(name)) {
            if (typeof value === 'object' && !Array.isArray(value)) {
                arranged = {...arranged, ...value};
                continue;
            }
        }

        arranged[name] = value;
    }

    for (const k in arranged) {
        error[k] = arranged[k];
    }
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

    get message() {
        return format(...this._message);
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
    static VisibleProperties = ['message', 'title', 'missingParameters'];
    static _zeroMessage = loc._f('Missing parameters.');
    static _message = loc._nf(0, 'Missing parameter: "%s".', 'Missing parameters: "%s".');

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

    async getMessageParams(loc) {
        return [await loc._and(...await loc._a(this.missingParameters))];
    }
}

export class MergeTypeError extends Error {
    static NoObjectValues = ['dstType', 'srcType'];
    static VisibleProperties = ['message'];
    static _message = loc._f('Cannot merge into "%s" from "%s".');

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

    async getMessageParam(loc) {  // eslint-disable-line no-unused-vars
        return [this.dstType, this.srcType];
    }
}

export async function getTranslatedParams(params, all, loc) {
    if (all) {
        return Promise.all(await params.map(async param => {
            if (Array.isArray(param))
                return await loc._(...param);
            else
                return await loc._(param);
        }));
    } else {
        return Promise.all(await params.map(async param => {
            if (Array.isArray(param))
                return await loc._(...param);
            else
                return param;
        }));
    }
}

export async function getErrorMessageParams(error, loc) {
    if (error.getMessageParams)
        return await error.getMessageParams(loc) || [];

    let _params = error._params;
    if (!_params) {
        let params = error.params;
        if (params)
            return await getTranslatedParams(params, false, loc);

        _params = error.constructor._params;
        if (!_params)
            return error.constructor.params || [];
    }

    return await getTranslatedParams(_params, true, loc);
}

export async function getErrorMessage(error, loc) {
    let message;
    if (error.getMessage) {
        message = await error.getMessage(loc);
        if (message) {
            return message;
        }
    }

    let _message = error._message;
    if (!_message) {
        let message = error.message;
        if (!message) {
            _message = error.constructor._message;
        }

        if (!_message) {
            if (!message) {
                message = error.constructor.message;
                if (!message) {
                    return;
                }
            }

            let params;
            if (Array.isArray(error.message)) {
                params = await getTranslatedParams(message.slice(1), false, loc);
                message = message[0];
            } else {
                params = await getErrorMessageParams(error, loc);
            }

            return format(message, ...params);
        }
    }

    // Only singular messages
    if (!Array.isArray(_message) || _message.length < 2 || !error._n) {
        let params;
        if (Array.isArray(_message)) {
            const _params = _message.slice(1);
            _message = _message[0];

            if (_params) {
                params = await getTranslatedParams(_params, true, loc);
            }
        } else {
            params = await getErrorMessageParams(error, loc);
        }

        return await loc._(_message, ...params);
    }
    
    // For singular/plural messages
    let _n = (typeof error._n === 'function')?
        error._n():
        error._n;

    if (!_n) {
        if (error._zeroMessage) {
            _message = error._zeroMessage;
        } else if (error.zeroMessage) {
            message = error.zeroMessage;
        } else if (!error._message) {
            if (error.constructor._zeroMessage) {
                _message = error.constructor._zeroMessage;
            } else {
                message = error.constructor.zeroMessage;
            }
        }

        if (_message) {
            if (Array.isArray(_message)) {
                params = await getTranslatedParams(_message.slice(1), false, loc);
                _message = message[0];
            } else {
                params = await getErrorMessageParams(error, loc);
            }

            return await loc._(_message, params);
        }

        if (message) {
            if (Array.isArray(message)) {
                params = await getTranslatedParams(message.slice(1), false, loc);
                message = message[0];
            } else {
                params = await getErrorMessageParams(error, loc);
            }

            return format(message, params);
        }

        return;
    }
    
    let _singular = _message[0],
        _plural = _message[1],
        _params = _message.slice(2),
        params;

    if (_params && _params.length > 0) {
        params = await getTranslatedParams(_params, true, loc);
    } else if (error.getMessageParams) {
        params = await error.getMessageParams(loc) || [];
    } else {
        params = await getErrorMessageParams(error, loc);
    }

    return loc._n(_n, _singular, _plural, ...params);
}

export async function getErrorData(error, loc, options) {
    let data = {};
    if (error instanceof Error) {
        data.name = error.constructor.name;
        if (data.name[0] == '_') {
            data.name = data.name.substring(1);
        }

        const visibleProperties = options?.properties ?? error.constructor?.VisibleProperties ?? ['message', 'title', 'length', 'fileName', 'lineNumber', 'columnNumber', 'stack', 'redirectTo'];
        visibleProperties.forEach(n => data[n] = error[n]);

        if (error.statusCode) {
            data.statusCode = error.statusCode;
        }

        data.message = await getErrorMessage(error, loc);
    } else {
        data.message = error;
    }

    if (error._title) {
        data.title = await loc._(error._title);
    }

    if (data.stack && typeof data.stack === 'string') {
        data.stack = data.stack.split('\n');
    }

    if (!data.error) {
        data.error = data.name || data.message || 'Error';
    }

    return data;
}

export async function errorHandler(error, loc, showInConsole) {
    const data = await getErrorData(error, loc);
    const logTitle = data.name? data.name + ': ': '';

    if (showInConsole || showInConsole === undefined) {
        console.error(logTitle + data.message);
        if (error.stack) {
            console.error(error.stack);
        }
    }

    return data;
}