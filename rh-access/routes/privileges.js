import {PrivilegesController} from '../controllers/privileges.js';
import {methodNotAllowed, asyncHandler} from 'http-util';

export default (app, checkPermission) => {
    app.head('/privileges', methodNotAllowed);
    app.get('/privileges', checkPermission('privileges'), asyncHandler(PrivilegesController.privilegesGet));
    app.all('/privileges', methodNotAllowed);
};