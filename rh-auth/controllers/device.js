const DeviceService = require('../services/device');
const sqlUtil = require('sql-util');
const ru = require('rofa-util');

function middleware(options) {
    return (req, res, next) => {
        const cookieName = options.cookieName || 'device';
        let cookie = req.cookies[cookieName];
        
        ru.check(cookie)
            .then(cookie => DeviceService.getForCookieCached(cookie))
            .then(device => {
                req.device = device.toJSON();
                next();
            })
            .catch(err => {
                if (err instanceof sqlUtil.NoRowsError || err instanceof ru.CheckError) {
                    DeviceService.create({data: JSON.stringify({'user-agent': req.headers['user-agent']})})
                        .then(device => {
                            res.cookie(cookieName, device.cookie, {path: '/', maxAge: 47304000000});
                            req.device = device.toJSON();
                            next();
                        })
                        .catch(err => res.status(500).send({error: err}));
                } else {
                    res.status(500).send({error: err});
                }
            });
    };
}

module.exports = {
    middleware: middleware,
};