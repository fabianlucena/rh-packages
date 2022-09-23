const util = require('util');

const LocaleService = {
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
};

module.exports = LocaleService;