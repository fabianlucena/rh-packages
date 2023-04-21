import {LoginController} from '../controllers/login.js';
import {methodNotAllowed, asyncHandler} from 'http-util';

export default (app) => {
    app.head('/login', methodNotAllowed);
    app.get('/login', asyncHandler(LoginController.getForm));
    app.post('/login', asyncHandler(LoginController.post));
    app.all('/login', methodNotAllowed);
};