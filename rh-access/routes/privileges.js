import {PrivilegesController} from '../controllers/privileges.js';
import {methodNotAllowed, asyncHandler} from 'http-util';

export default (app) => {
    app.head('/privileges', methodNotAllowed);
    app.get('/privileges', asyncHandler(PrivilegesController.privilegesGet));
    app.all('/privileges', methodNotAllowed);
};