'use strict';

import * as util from 'util';

export class Locale {
    constructor(options) {
        this.setOptions(options);
    }

    clone() {
        return new Locale(this);
    }

    setOptions(options) {
        for (const k in options)
            this[k] = options[k];

        return this;
    }

    _f(text) {
        return text;
    }
    
    _fp(text, ...params) {
        return [text, ...params];
    }
    
    _nf(n, singular, plural, ...opt) {
        return [singular, plural, ...opt];
    }

    async _d(domains, text, ...opt) {
        if (this.driver)
            text = await this.driver(this.language, text, domains);

        return util.format(text, ...opt);
    }
    
    async _(text, ...opt) {
        return this._d(null, text, ...opt);
    }

    async _nd(domains, n, singular, plural, ...opt) {
        return util.format((n == 1)? singular: plural, ...opt);
    }

    async _n(n, singular, plural, ...opt) {
        return this._nd(null, n, singular, plural, ...opt);
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

export const loc = new Locale();

export async function getTranslatedParamsAsync(params, all, loc) {
    if (all) {
        return Promise.all(await params.map(async param => {
            if (param instanceof Array)
                return await loc._(...param);
            else
                return await loc._(param);
        }));
    } else {
        return Promise.all(await params.map(async param => {
            if (param instanceof Array)
                return await loc._(...param);
            else
                return param;
        }));
    }
}
