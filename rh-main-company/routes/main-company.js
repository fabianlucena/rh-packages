import {MainCompanyController} from '../controllers/main-company.js';
import {methodNotAllowed, corsSimplePreflight, asyncHandler} from 'http-util';

export default (app, checkPermission) => {
    app.options('/main-company', corsSimplePreflight('GET,HEAD,POST,PATCH,DELETE'));
    app.options('/main-company/:uuid', corsSimplePreflight('GET,HEAD,PATCH,DELETE'));
    app.options('/main-company/enable', corsSimplePreflight('POST'));
    app.options('/main-company/enable/:uuid', corsSimplePreflight('POST'));
    app.options('/main-company/disable', corsSimplePreflight('POST'));
    app.options('/main-company/disable/:uuid', corsSimplePreflight('POST'));
    
    app.post('/main-company', checkPermission('main-company.create'), asyncHandler(MainCompanyController, 'post'));
    app.get('/main-company', checkPermission('main-company.get'), asyncHandler(MainCompanyController, 'get'));

    app.get('/main-company/:uuid', checkPermission('main-company.get'), asyncHandler(MainCompanyController, 'get'));

    app.delete('/main-company', checkPermission('main-company.delete'), asyncHandler(MainCompanyController, 'delete'));
    app.delete('/main-company/:uuid', checkPermission('main-company.delete'), asyncHandler(MainCompanyController, 'delete'));

    app.post('/main-company/enable', checkPermission('main-company.edit'), asyncHandler(MainCompanyController, 'enablePost'));
    app.post('/main-company/enable/:uuid', checkPermission('main-company.edit'), asyncHandler(MainCompanyController, 'enablePost'));
    
    app.post('/main-company/disable', checkPermission('main-company.edit'), asyncHandler(MainCompanyController, 'disablePost'));
    app.post('/main-company/disable/:uuid', checkPermission('main-company.edit'), asyncHandler(MainCompanyController, 'disablePost'));
    
    app.patch('/main-company', checkPermission('main-company.edit'), asyncHandler(MainCompanyController, 'patch'));
    app.patch('/main-company/:uuid', checkPermission('main-company.edit'), asyncHandler(MainCompanyController, 'patch'));

    app.all('/main-company', methodNotAllowed);
};


