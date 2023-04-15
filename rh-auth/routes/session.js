import {SessionController} from '../controllers/session.js';
import {methodNotAllowed, asyncHandler} from 'http-util';

export default (app, checkPermission) => {
    app.head('/session', methodNotAllowed);
    app.get('/session', checkPermission('ownsession.get', 'session.get'), asyncHandler(SessionController.get));
    app.delete('/session', checkPermission('session.delete'), asyncHandler(SessionController.delete));
    app.all('/session', methodNotAllowed);
};