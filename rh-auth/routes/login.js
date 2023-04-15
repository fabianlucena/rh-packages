import {LoginController} from '../controllers/login.js';
import {methodNotAllowed, asyncHandler} from 'http-util';

export default (app, checkPermission) => {
    app.head('/login', methodNotAllowed);
    app.get('/login', checkPermission('login'), asyncHandler(LoginController.getForm));
    app.post('/login', checkPermission('login'), asyncHandler(LoginController.post));
    app.all('/login', methodNotAllowed);
};