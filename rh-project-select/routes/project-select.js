import { ProjectSelectController } from '../controllers/project-select.js';
import { methodNotAllowed, corsSimplePreflight, asyncHandler } from 'http-util';

export default (app, checkPermission) => {
  app.options('/project-select', corsSimplePreflight('GET,HEAD,POST'));
  app.get('/project-select', checkPermission('project-select.switch'), asyncHandler(ProjectSelectController, 'get'));
  app.post('/project-select', checkPermission('project-select.switch'), asyncHandler(ProjectSelectController, 'post'));
  app.all('/project-select', methodNotAllowed);
};