import {ProjectController} from '../controllers/project.js';
import {methodNotAllowed, corsSimplePreflight, asyncHandler} from 'http-util';

export default (app, checkPermission) => {
    app.options('/project', corsSimplePreflight('GET,HEAD,POST,PATCH,DELETE'));
    app.options('/project/company', corsSimplePreflight('GET,HEAD'));
    app.options('/project/enable', corsSimplePreflight('POST'));
    app.options('/project/enable/:uuid', corsSimplePreflight('POST'));
    app.options('/project/disable', corsSimplePreflight('POST'));
    app.options('/project/disable/:uuid', corsSimplePreflight('POST'));
    app.options('/project/:uuid', corsSimplePreflight('GET,PATCH,DELETE'));

    app.post('/project', checkPermission('project.create'), asyncHandler(ProjectController, 'post'));
    app.get('/project', checkPermission('project.get'), asyncHandler(ProjectController, 'get'));
    app.get('/project/company', checkPermission('project.edit'), asyncHandler(ProjectController, 'getCompany'));

    app.get('/project/:uuid', checkPermission('project.get'), asyncHandler(ProjectController, 'get'));

    app.delete('/project', checkPermission('project.delete'), asyncHandler(ProjectController, 'delete'));
    app.delete('/project/:uuid', checkPermission('project.delete'), asyncHandler(ProjectController, 'delete'));

    app.post('/project/enable', checkPermission('project.edit'), asyncHandler(ProjectController, 'enablePost'));
    app.post('/project/enable/:uuid', checkPermission('project.edit'), asyncHandler(ProjectController, 'enablePost'));
    
    app.post('/project/disable', checkPermission('project.edit'), asyncHandler(ProjectController, 'disablePost'));
    app.post('/project/disable/:uuid', checkPermission('project.edit'), asyncHandler(ProjectController, 'disablePost'));

    app.patch('/project', checkPermission('project.edit'), asyncHandler(ProjectController, 'patch'));
    app.patch('/project/:uuid', checkPermission('project.edit'), asyncHandler(ProjectController, 'patch'));

    app.all('/project', methodNotAllowed);
};