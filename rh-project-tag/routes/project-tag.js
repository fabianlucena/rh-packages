import { projectTagController } from '../controllers/project-tag.js';
import { conf } from '../conf.js';
import { corsSimplePreflight, methodNotAllowed, asyncHandler } from 'http-util';

export default (app, checkPermission) => {
  app.options('/project-tag/tags', corsSimplePreflight('GET'));
  app.get('/project-tag/tags', checkPermission(...conf.permissions), asyncHandler(projectTagController, 'getTags'));
  app.all('/project-tag/tags', methodNotAllowed);
};