import { TagsController } from '../controllers/tags.js';
import { methodNotAllowed, corsSimplePreflight, asyncHandler } from 'http-util';

export default (app/*, checkPermission */) => {
  app.options('/eav/tags', corsSimplePreflight('GET,HEAD'));

  app.get('/eav/tags', asyncHandler(TagsController, 'get'));

  app.all('/eav/tags', methodNotAllowed);
};