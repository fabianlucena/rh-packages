import {SwitchSiteController} from '../controllers/switch_site.js';
import {methodNotAllowed, corsSimplePreflight, asyncHandler} from 'http-util';

export default (app, checkPermission) => {
    app.options('/switch-site', corsSimplePreflight('GET,HEAD,POST'));
    app.get('/switch-site', checkPermission('current-site.switch'), asyncHandler(SwitchSiteController, 'get'));
    app.post('/switch-site', checkPermission('current-site.switch'), asyncHandler(SwitchSiteController, 'post'));
    app.all('/switch-site', methodNotAllowed);
    
    app.options('/current-site', corsSimplePreflight('GET,HEAD'));
    app.get('/current-site', checkPermission('current-site.get'), asyncHandler(SwitchSiteController, 'get'));
    app.all('/current-site', methodNotAllowed);
};