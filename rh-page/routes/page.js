'use strict';

import {PageController} from '../controllers/page.js';
import {corsSimplePreflight, asyncHandler, methodNotAllowed} from 'http-util';

export default (app) => {
    app.options('/page', corsSimplePreflight('GET'));
    app.get('/page', asyncHandler(PageController, 'get'));
    app.all('/page', methodNotAllowed);
};