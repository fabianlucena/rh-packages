import {SiteController} from '../controllers/site.js';
import {methodNotAllowed, corsSimplePreflight} from 'http-util';

export default (app, checkPermission) => {
    app.options('/site', corsSimplePreflight('GET,HEAD'));
    app.get('/site', checkPermission('site.get'), SiteController.get);
    app.all('/site', methodNotAllowed);
};