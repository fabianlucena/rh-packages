import {AuthorizedUserController} from '../controllers/authorized-user.js';
import {conf} from '../conf.js';
import {methodNotAllowed, corsSimplePreflight, asyncHandler} from 'http-util';

export default (app, checkPermission) => {
    const UserController = conf.global.controllers.User;

    app.options('/authorized-user', corsSimplePreflight('GET,HEAD,POST,PATCH,DELETE'));
    app.options('/authorized-user/enable', corsSimplePreflight('POST'));
    app.options('/authorized-user/enable/:uuid', corsSimplePreflight('POST'));
    app.options('/authorized-user/disable', corsSimplePreflight('POST'));
    app.options('/authorized-user/disable/:uuid', corsSimplePreflight('POST'));
    app.options('/authorized-user/:uuid', corsSimplePreflight('GET,PATCH,DELETE'));

    app.post('/authorized-user', checkPermission('authorized-user.create'), asyncHandler(AuthorizedUserController.post));
    app.get('/authorized-user', checkPermission('authorized-user.get'), asyncHandler(AuthorizedUserController.get));

    app.get('/authorized-user/:uuid', checkPermission('authorized-user.get'), asyncHandler(AuthorizedUserController.get));

    app.delete('/authorized-user', checkPermission('authorized-user.delete'), asyncHandler(UserController.delete));
    app.delete('/authorized-user/:uuid', checkPermission('authorized-user.delete'), asyncHandler(UserController.delete));

    app.post('/authorized-user/enable', checkPermission('authorized-user.edit'), asyncHandler(UserController.enablePost));
    app.post('/authorized-user/enable/:uuid', checkPermission('authorized-user.edit'), asyncHandler(UserController.enablePost));
    
    app.post('/authorized-user/disable', checkPermission('authorized-user.edit'), asyncHandler(UserController.disablePost));
    app.post('/authorized-user/disable/:uuid', checkPermission('authorized-user.edit'), asyncHandler(UserController.disablePost));

    app.patch('/authorized-user', checkPermission('authorized-user.edit'), asyncHandler(UserController.patch));
    app.patch('/authorized-user/:uuid', checkPermission('authorized-user.edit'), asyncHandler(UserController.patch));

    app.all('/authorized-user', methodNotAllowed);
};