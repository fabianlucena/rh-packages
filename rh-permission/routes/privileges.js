import {PrivilegesController} from '../controllers/privileges.js';
import {methodNotAllowed} from 'http-util';

export default (app, checkPermission) => {
    app.get('/privileges', checkPermission('privileges'), PrivilegesController.privilegesGet);
    app.all('/privileges', methodNotAllowed);
};