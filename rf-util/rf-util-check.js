'use strict';

import {MissingParameterError, CheckError} from './rf-util-error.js';
import * as uuid from 'uuid';

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

export function checkValidUuid(value, paramName, options) {
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

export function checkParameterUuid(value, paramName) {
    value = checkParameter(value, paramName);
    return checkValidUuid(value, paramName, {statusCode: 400});
}

export function checkValidUuidList(value, paramName, options) {
    if (!options)
        options = {};

    if (!options.statusCode)
        options.statusCode = 500;
        
    if (!options.method)
        options.method = uuidList => {
            for (let i in uuidList) {
                if (!uuid.validate(uuidList[i]))
                    return false;
            }

            return true;
        };

    if (!options._message)
        options._message = ['%s is not a valid UUID value', paramName];

    return check(value, options);
}

export function checkParameterUuidList(value, paramName) {
    value = checkParameter(value, paramName);
    return checkValidUuidList(value, paramName, {statusCode: 400});
}