import {LocaleService} from '../services/locale.js';

export function middleware() {
    return (req, res, next) => {
        req.locale = LocaleService;
        next();
    };
}
