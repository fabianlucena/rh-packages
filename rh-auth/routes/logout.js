import {LogoutController} from '../controllers/logout.js';
import {methodNotAllowed} from 'http-util';

export default (app, checkPermission) => {
    app.head('/logout', methodNotAllowed);
    app.get('/logout', checkPermission('logout'), LogoutController.get);
    app.all('/logout', methodNotAllowed);
};