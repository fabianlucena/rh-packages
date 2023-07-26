'use strict';

import {projectTagController} from '../controllers/project-tag.js';
import {conf} from '../conf.js';
import {corsSimplePreflight, methodNotAllowed, asyncHandler} from 'http-util';

export default (app, checkPermission) => {
    app.options('/project-tag', corsSimplePreflight('GET'));
    app.get('/project-tag', checkPermission(...conf.permissions), asyncHandler(projectTagController, 'get'));
    app.all('/project-tag', methodNotAllowed);
};