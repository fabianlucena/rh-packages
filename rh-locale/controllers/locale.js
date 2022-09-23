const LocaleService = require('../services/locale');

function middleware() {
    return (req, res, next) => {
        req.locale = LocaleService;
        next();
    }
}

module.exports = {
    middleware: middleware,
}