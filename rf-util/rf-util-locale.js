'use strict';

import * as util from 'util';

export class Locale {
    _f(string) {
        return string;
    }
    
    _fp(string, ...params) {
        return [string, ...params];
    }
    
    _nf(n, singular, plural, ...opt) {
        return [singular, plural, ...opt];
    }
    
    async _(string, ...opt) {
        return util.format(string, ...opt);
    }

    async _n(n, singular, plural, ...opt) {
        return util.format((n == 1)? singular: plural, ...opt);
    }

    async _or(...list) {
        if (list.length < 2)
            return list[0];
        
        return list.slice(0, -1).join(', ') + ', or ' + list[list.length - 1];
    }

    async _and(...list) {
        if (list.length < 2)
            return list[0];
        
        return list.slice(0, -1).join(', ') + ', and ' + list[list.length - 1];
    }
}

export const l = new Locale();

export function localeMiddleware(req, res, next) {
    req.locale = l;
    next();
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
