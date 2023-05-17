'use strict';

import {MissingParameterError, CheckError} from './rf-util-error.js';
import {loc} from 'rf-locale';
import * as uuid from 'uuid';

export function checkParameter(value, params, ...freeParams) {
    if (typeof params === 'string') {
        const newParams = {};
        newParams[params] = params;
        params = newParams;
    }

    freeParams.forEach(p => params[p] = p);

    if (!value)
        throw new MissingParameterError(...Object.values(params));

    const missing = [];
    for (let name in params) {
        if (value[name] === undefined)
            missing.push(params[name]);
    }

    if (missing.length)
        throw new MissingParameterError(...missing);

    return value;
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

function getCheckOptionsFromParams(options, moreOptions) {
    if (typeof options === 'string' || typeof options === 'function')
        options = {paramName: options};

    return {...options, ...moreOptions};
}

export function checkNotNullOrEmpty(value, options) {
    options = {
        method: v => !!v,
        statusCode: 500,
        _message: [loc._f('"%s" is null or empty'), options.paramName],
        ...options
    };

    return check(value, options);
}

export function checkParameterNotNullOrEmpty(value, options) {
    options = getCheckOptionsFromParams(options);
    return checkNotNullOrEmpty(
        value,
        {
            statusCode: 400,
            _message: [loc._f('"%s" parameter is null or empty'), options.paramName],
            ...options,
        }
    );
}

export function checkValidUuid(value, options) {
    options = {
        method: uuid.validate,
        statusCode: 500,
        _message: [loc._f('"%s" is not a valid UUID value'), options.paramName],
        ...options
    };

    return check(value, options);
}

export function checkParameterUuid(value, options) {
    options = getCheckOptionsFromParams(options);
    return checkNotNullOrEmpty(
        value,
        {
            statusCode: 400,
            _message: [loc._f('"%s" parameter is not a valid UUID value'), options.paramName],
            ...options,
        }
    );
}

export function checkValidUuidList(value, options) {
    options = {
        method: uuidList => {
            for (let i in uuidList) {
                if (!uuid.validate(uuidList[i]))
                    return false;
            }

            return true;
        },
        statusCode: 500,
        _message: [loc._f('"%s" is not a valid UUID value'), options.paramName],
        ...options,
    };

    return check(value, options);
}

export function checkParameterUuidList(value, options) {
    options = getCheckOptionsFromParams(options);
    return checkNotNullOrEmpty(
        value,
        {
            statusCode: 400,
            _message: [loc._f('"%s" parameter is not a valid UUID value'), options.paramName],
            ...options,
        }
    );
}