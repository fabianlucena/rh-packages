import {format} from './rf-util-string.js';

export class Loc {
    _(text, ...opt) {
        return format(text, ...opt);
    }

    _f(text, ...params) {
        if (params && params.length) {
            return [text, ...params];
        }
    
        return text;
    }

    _c(context, text, ...opt) {
        return this._(text, ...opt);
    }

    _cf(context, text, ...opt) {
        return this._f(text, ...opt);
    }
    
    _nf(n, singular, plural, ...opt) {
        return [singular, plural, ...opt];
    }

    _and(...list) {
        if (list.length < 2) {
            return list[0];
        }
        
        return list.slice(0, -1).join(', ') + ', and ' + list[list.length - 1];
    }
}

export const loc = new Loc;
export const defaultLoc = loc;