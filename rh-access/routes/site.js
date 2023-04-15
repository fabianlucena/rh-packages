import {SiteController} from '../controllers/site.js';
import {methodNotAllowed, asyncHandler} from 'http-util';

export default async (app, checkPermission) =>  {
    app.head('/switch-site', methodNotAllowed);
    app.post('/switch-site', checkPermission('current-site.switch'), asyncHandler(SiteController.switchSitePost));
    app.all('/switch-site', methodNotAllowed);
   
    app.head('/current-site', methodNotAllowed);
    app.get('/current-site', checkPermission('current-site.get'), asyncHandler(SiteController.currentSiteGet));
    app.all('/current-site', methodNotAllowed);

    app.head('/site', methodNotAllowed);
    app.get('/site', checkPermission('site.get'), asyncHandler(SiteController.siteGet));
    app.all('/site', methodNotAllowed);
};
