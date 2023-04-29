'use strict';

import {getTranslatedParamsAsync} from 'rf-locale';
import {loc} from 'rf-locale';
import * as util from 'util';

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
    static _zeroMessage = loc._f('Mising parameters.');
    static _message = loc._nf(0, 'Mising parameter: "%s".', 'Mising parameters: "%s".');

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

    async getMessageParamsAsync(loc) {
        return [await loc._and(...this.missingParameters)];
    }
}

export class MergeTypeError extends Error {
    static NoObjectValues = ['dstType', 'srcType'];
    static VisibleProperties = ['message'];
    static _message = loc._f('Cannot merge into "%s" a "%s".');

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

    async getMessageParamAsync(loc) {  // eslint-disable-line no-unused-vars
        return [this.dstType, this.srcType];
    }
}

export async function getErrorMessageParamsAsync(error, loc) {
    if (error.getMessageParamsAsync)
        return await error.getMessageParamsAsync(loc) || [];

    let _params = error._params;
    if (!_params) {
        let params = error.params;
        if (params)
            return await getTranslatedParamsAsync(params, false, loc);

        _params = error.constructor._params;
        if (!_params)
            return error.constructor.params || [];
    }

    return await getTranslatedParamsAsync(_params, true, loc);
}

export async function getErrorMessageAsync(error, loc) {
    let message;
    if (error.getMessageAsync) {
        message = await error.getMessageAsync(loc);
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
                params = await getTranslatedParamsAsync(message.slice(1), false, loc);
                message = message[0];
            } else
                params = await getErrorMessageParamsAsync(error, loc);

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
                params = await getTranslatedParamsAsync(_params, true, loc);
        }
        else
            params = await getErrorMessageParamsAsync(error, loc);

        return loc._(_message, ...params);
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
                params = await getTranslatedParamsAsync(_message.slice(1), false, loc);
                _message = message[0];
            } else
                params = await getErrorMessageParamsAsync(error, loc);

            return loc._(_message, params);
        }

        if (message) {
            if (message instanceof Array) {
                params = await getTranslatedParamsAsync(message.slice(1), false, loc);
                message = message[0];
            } else
                params = await getErrorMessageParamsAsync(error, loc);

            return util.format(message, params);
        }

        return;
    }
    
    let _singular = _message[0],
        _plural = _message[1],
        _params = _message.slice(2),
        params;

    if (_params && _params.length > 0)
        params = await getTranslatedParamsAsync(_params, true, loc);
    else if (error.getMessageParamsAsync)
        params = await error.getMessageParamsAsync(loc) || [];
    else
        params = await getErrorMessageParamsAsync(error, loc);

    return loc._n(_n, _singular, _plural, ...params);
}

export async function getErrorDataAsync(error, loc) {
    let data = {};
    if (error instanceof Error) {
        data.name = error.constructor.name;
        if (data.name[0] == '_')
            data.name = data.name.substring(1);

        const visibleProperties = error.constructor?.VisibleProperties ?? ['message', 'length', 'fileName', 'lineNumber', 'columnNumber', 'stack'];
        visibleProperties.forEach(n => data[n] = error[n]);

        if (error.statusCode)
            data.statusCode = error.statusCode;

        data.message = await getErrorMessageAsync(error, loc);
    } else
        data.message = error;

    if (!data.error)
        data.error = data.name || data.message || 'Error';

    return data;
}

export async function errorHandlerAsync(error, loc, showInConsole) {
    const data = await getErrorDataAsync(error, loc ?? loc);
    const logTitle = data.name? data.name + ': ': '';

    if (showInConsole || showInConsole === undefined) {
        console.error(logTitle + data.message);
        if (error.stack)
            console.error(error.stack);
    }

    return data;
}