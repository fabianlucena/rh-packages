import './services/device.js';
import './services/session.js';
import {DeviceController} from './controllers/device.js';
import LoginRouter from './routes/login.js';
import {SessionController} from './controllers/session.js';
import {conf as localConf} from './conf.js';
import express from 'express';

export const conf = localConf;

conf.configure = function (global) {
    if (global.router) {
        global.router.use(DeviceController.configureMiddleware({cookieName: 'device'}));

        LoginRouter(global.router, global.checkRoutePermission);
        
        const router = express.Router();
        router.use(SessionController.configureMiddleware());

        global.router.use('/', router);
        global.router = router;
    }
};
