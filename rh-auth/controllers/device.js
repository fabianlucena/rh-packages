const DeviceService = require('../services/device');
const sqlUtil = require('sql-util');
const ru = require('rofa-util');
const httpUtil = require('http-util');

function middleware(options) {
    return (req, res, next) => {
        const cookieName = options.cookieName || 'device';
        let cookie = req.cookies[cookieName];
        
        ru.checkAsync(cookie)
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
                    httpUtil.sendErrorAsync(req, res, err);
                }
            });
    };
}

module.exports = {
    middleware,
};