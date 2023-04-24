import {LoginController} from '../controllers/login.js';
import {corsSimplePreflight, methodNotAllowed, asyncHandler} from 'http-util';

export default (app) => {
    app.options('/login', corsSimplePreflight('GET,POST'));
    app.get('/login', asyncHandler(LoginController.getForm));
    app.post('/login', asyncHandler(LoginController.post));
    app.all('/login', methodNotAllowed);
};