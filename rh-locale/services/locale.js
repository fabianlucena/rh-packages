import {format} from 'util';

export class LocaleService {
    static _f(string) {
        return string;
    }
    
    static _fp(string, ...params) {
        return [string, ...params];
    }
    
    static _nf(n, singular, plural, ...opt) {
        return [singular, plural, ...opt];
    }
    
    static async _(string, ...opt) {
        return format(string, ...opt);
    }

    static async _n(n, singular, plural, ...opt) {
        return format((n == 1)? singular: plural, ...opt);
    }

    static async _or(...list) {
        if (list.length < 2)
            return list[0];
        
        return list.slice(0, -1).join(', ') + ', or ' + list[list.length - 1];
    }

    static async _and(...list) {
        if (list.length < 2)
            return list[0];
        
        return list.slice(0, -1).join(', ') + ', and ' + list[list.length - 1];
    }
}