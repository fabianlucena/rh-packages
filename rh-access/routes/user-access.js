import {UserAccessController} from '../controllers/user-access.js';
//import {conf} from '../conf.js';
import {methodNotAllowed, corsSimplePreflight, asyncHandler} from 'http-util';

export default (app, checkPermission) => {
    app.options('/user-access', corsSimplePreflight('GET,HEAD,POST,PATCH,DELETE'));
    app.options('/user-access/:uuid', corsSimplePreflight('GET,PATCH,DELETE'));
    app.options('/user-access-user', corsSimplePreflight('GET'));
    app.options('/user-access-site', corsSimplePreflight('GET'));
    app.options('/user-access-role', corsSimplePreflight('GET'));
    
    app.post('/user-access', checkPermission('user-access.create'), asyncHandler(UserAccessController.post));
    app.get('/user-access', checkPermission('user-access.get'), asyncHandler(UserAccessController.get));
    app.get('/user-access/:uuid', checkPermission('user-access.get'), asyncHandler(UserAccessController.get));

    /*
    app.delete('/user-access', checkPermission('user-access.delete'), asyncHandler(UserController.delete));
    app.delete('/user-access/:uuid', checkPermission('user-access.delete'), asyncHandler(UserController.delete));

    app.patch('/user-access', checkPermission('user-access.edit'), asyncHandler(UserController.patch));
    app.patch('/user-access/:uuid', checkPermission('user-access.edit'), asyncHandler(UserController.patch));
    */

    app.get('/user-access-user', checkPermission('user-access.edit'), asyncHandler(UserAccessController.getUsers));
    app.get('/user-access-site', checkPermission('user-access.edit'), asyncHandler(UserAccessController.getSites));
    app.get('/user-access-role', checkPermission('user-access.edit'), asyncHandler(UserAccessController.getRoles));
    
    app.all('/user-access', methodNotAllowed);
};