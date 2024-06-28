import { LogController } from '../controllers/log.js';
import { methodNotAllowed, corsSimplePreflight, asyncHandler } from 'http-util';

export default (app, checkPermission) => {
  app.options('/log', corsSimplePreflight('GET,HEAD'));

  app.get('/log', checkPermission('log.get'), asyncHandler(LogController, 'get'));

  app.all('/log', methodNotAllowed);
};