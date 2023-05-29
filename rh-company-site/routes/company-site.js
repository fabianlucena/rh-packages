'use strict';

import {CompanySiteController} from '../controllers/company-site.js';
import {methodNotAllowed, corsSimplePreflight, asyncHandler} from 'http-util';

export default (app, checkPermission) => {
    app.options('/company-site', corsSimplePreflight('GET,HEAD,POST'));
    app.get('/company-site', checkPermission('company-site.switch'), asyncHandler(CompanySiteController.get));
    app.post('/company-site', checkPermission('company-site.switch'), asyncHandler(CompanySiteController.post));
    app.all('/company-site', methodNotAllowed);
};