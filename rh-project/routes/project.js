import {ProjectController} from '../controllers/project.js';
import {methodNotAllowed, corsSimplePreflight, asyncHandler} from 'http-util';

export default (app, checkPermission) => {
    app.options('/project', corsSimplePreflight('GET,HEAD,POST,PATCH,DELETE'));
    app.options('/project/enable', corsSimplePreflight('POST'));
    app.options('/project/enable/:uuid', corsSimplePreflight('POST'));
    app.options('/project/disable', corsSimplePreflight('POST'));
    app.options('/project/disable/:uuid', corsSimplePreflight('POST'));
    app.options('/project/:uuid', corsSimplePreflight('GET,PATCH,DELETE'));

    app.post('/project', checkPermission('project.create'), asyncHandler(ProjectController.post));
    app.get('/project', checkPermission('project.get'), asyncHandler(ProjectController.get));

    app.get('/project/:uuid', checkPermission('project.get'), asyncHandler(ProjectController.get));

    app.delete('/project', checkPermission('project.delete'), asyncHandler(ProjectController.delete));
    app.delete('/project/:uuid', checkPermission('project.delete'), asyncHandler(ProjectController.delete));

    app.post('/project/enable', checkPermission('project.update'), asyncHandler(ProjectController.enablePost));
    app.post('/project/enable/:uuid', checkPermission('project.update'), asyncHandler(ProjectController.enablePost));
    
    app.post('/project/disable', checkPermission('project.update'), asyncHandler(ProjectController.disablePost));
    app.post('/project/disable/:uuid', checkPermission('project.update'), asyncHandler(ProjectController.disablePost));

    app.patch('/project', checkPermission('project.update'), asyncHandler(ProjectController.patch));
    app.patch('/project/:uuid', checkPermission('project.update'), asyncHandler(ProjectController.patch));

    app.all('/project', methodNotAllowed);
};