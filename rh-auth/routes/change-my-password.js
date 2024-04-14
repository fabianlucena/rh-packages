import { ChangeMyPasswordController } from '../controllers/change-my-password.js';
import { corsSimplePreflight, methodNotAllowed, asyncHandler } from 'http-util';

export default (app) => {
  app.options('/change-my-password', corsSimplePreflight('GET,POST'));

  app.get('/change-my-password', asyncHandler(ChangeMyPasswordController, 'getForm'));
  app.post('/change-my-password', asyncHandler(ChangeMyPasswordController, 'post'));
  app.all('/change-my-password', methodNotAllowed);
};