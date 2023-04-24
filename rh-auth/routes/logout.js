import {LogoutController} from '../controllers/logout.js';
import {corsSimplePreflight, methodNotAllowed} from 'http-util';

export default (app, checkPermission) => {
    app.options('/logout', corsSimplePreflight('POST'));
    app.post('/logout', checkPermission('logout'), LogoutController.post);
    app.all('/logout', methodNotAllowed);
};