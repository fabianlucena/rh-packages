import {PermittedUserController} from '../controllers/permitted-user.js';
import {conf} from '../conf.js';
import {methodNotAllowed, corsSimplePreflight, asyncHandler} from 'http-util';

export default (app, checkPermission) => {
    const UserController = conf.global.controllers.User;

    app.options('/permitted-user', corsSimplePreflight('GET,HEAD,POST,PATCH,DELETE'));
    app.options('/permitted-user/enable', corsSimplePreflight('POST'));
    app.options('/permitted-user/enable/:uuid', corsSimplePreflight('POST'));
    app.options('/permitted-user/disable', corsSimplePreflight('POST'));
    app.options('/permitted-user/disable/:uuid', corsSimplePreflight('POST'));
    app.options('/permitted-user/:uuid', corsSimplePreflight('GET,PATCH,DELETE'));

    app.post('/permitted-user', checkPermission('permitted-user.create'), asyncHandler(PermittedUserController.post));
    app.get('/permitted-user', checkPermission('permitted-user.get'), asyncHandler(PermittedUserController.get));

    app.get('/permitted-user/:uuid', checkPermission('permitted-user.get'), asyncHandler(PermittedUserController.get));

    app.delete('/permitted-user', checkPermission('permitted-user.delete'), asyncHandler(UserController.delete));
    app.delete('/permitted-user/:uuid', checkPermission('permitted-user.delete'), asyncHandler(UserController.delete));

    app.post('/permitted-user/enable', checkPermission('permitted-user.edit'), asyncHandler(UserController.enablePost));
    app.post('/permitted-user/enable/:uuid', checkPermission('permitted-user.edit'), asyncHandler(UserController.enablePost));
    
    app.post('/permitted-user/disable', checkPermission('permitted-user.edit'), asyncHandler(UserController.disablePost));
    app.post('/permitted-user/disable/:uuid', checkPermission('permitted-user.edit'), asyncHandler(UserController.disablePost));

    app.patch('/permitted-user', checkPermission('permitted-user.edit'), asyncHandler(UserController.patch));
    app.patch('/permitted-user/:uuid', checkPermission('permitted-user.edit'), asyncHandler(UserController.patch));

    app.all('/permitted-user', methodNotAllowed);
};