import {DeviceService} from '../services/device.js';
import {NoRowsError} from 'sql-util';
import {sendErrorAsync} from 'http-util';
import {checkAsync, CheckError} from 'rofa-util';

export class DeviceController {
    static configureMiddleware(options) {
        return (req, res, next) => {
            const cookieName = options.cookieName || 'device';
            let cookie = req.cookies[cookieName];
            
            checkAsync(cookie)
                .then(cookie => DeviceService.getForCookieCached(cookie))
                .then(device => {
                    req.device = device.toJSON();
                    next();
                })
                .catch(err => {
                    if (err instanceof NoRowsError || err instanceof CheckError) {
                        DeviceService.create({data: JSON.stringify({'user-agent': req.headers['user-agent']})})
                            .then(device => {
                                res.cookie(cookieName, device.cookie, {path: '/', maxAge: 47304000000});
                                req.device = device.toJSON();
                                next();
                            })
                            .catch(err => res.status(500).send({error: err}));
                    } else {
                        sendErrorAsync(req, res, err);
                    }
                });
        };
    }
}