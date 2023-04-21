import {SiteController} from '../controllers/site.js';
import {methodNotAllowed} from 'http-util';

export default (app, checkPermission) => {
    app.post('/switch-site', checkPermission('current-site.switch'), SiteController.switchSitePost);
    app.all('/switch-site', methodNotAllowed);
    
    app.get('/current-site', checkPermission('current-site.get'), SiteController.currentSiteGet);
    app.all('/current-site', methodNotAllowed);

    app.get('/site', checkPermission('site.get'), SiteController.get);
    app.all('/site', methodNotAllowed);
};