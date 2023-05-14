import {UserController} from '../controllers/user.js';
import {methodNotAllowed, corsSimplePreflight, asyncHandler} from 'http-util';

export default (app, checkPermission) => {
    app.options('/user', corsSimplePreflight('GET,HEAD,POST,PATCH,DELETE'));
    app.options('/user/enable', corsSimplePreflight('POST'));
    app.options('/user/enable/:uuid', corsSimplePreflight('POST'));
    app.options('/user/disable', corsSimplePreflight('POST'));
    app.options('/user/disable/:uuid', corsSimplePreflight('POST'));
    app.options('/user/:uuid', corsSimplePreflight('GET,PATCH,DELETE'));

    app.post('/user', checkPermission('user.create'), asyncHandler(UserController.post));
    app.get('/user', checkPermission('user.get'), asyncHandler(UserController.get));

    app.get('/user/:uuid', checkPermission('user.get'), asyncHandler(UserController.get));

    app.delete('/user', checkPermission('user.delete'), asyncHandler(UserController.delete));
    app.delete('/user/:uuid', checkPermission('user.delete'), asyncHandler(UserController.delete));

    app.post('/user/enable', checkPermission('user.edit'), asyncHandler(UserController.enablePost));
    app.post('/user/enable/:uuid', checkPermission('user.edit'), asyncHandler(UserController.enablePost));
    
    app.post('/user/disable', checkPermission('user.edit'), asyncHandler(UserController.disablePost));
    app.post('/user/disable/:uuid', checkPermission('user.edit'), asyncHandler(UserController.disablePost));

    app.patch('/user', checkPermission('user.edit'), asyncHandler(UserController.patch));
    app.patch('/user/:uuid', checkPermission('user.edit'), asyncHandler(UserController.patch));

    app.all('/user', methodNotAllowed);
};