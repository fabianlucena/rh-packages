import {format} from './rf-util-format.js';

export class Loc {
    _(text, ...opt) {
        return format(text, ...opt);
    }

    _c(contrxt, text, ...opt) {
        return this._(text, ...opt);
    }

    _f(text, ...params) {
        if (params && params.length) {
            return [text, ...params];
        }
    
        return text;
    }
    
    _nf(n, singular, plural, ...opt) {
        return [singular, plural, ...opt];
    }
}

export const loc = new Loc;