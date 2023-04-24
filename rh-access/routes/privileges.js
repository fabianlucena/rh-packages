import {PrivilegesController} from '../controllers/privileges.js';
import {methodNotAllowed, corsSimplePreflight, asyncHandler} from 'http-util';

export default (app) => {
    app.options('/privileges', corsSimplePreflight('GET,HEAD'));
    app.get('/privileges', asyncHandler(PrivilegesController.privilegesGet));
    app.all('/privileges', methodNotAllowed);
};