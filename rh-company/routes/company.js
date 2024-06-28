import { CompanyController } from '../controllers/company.js';
import { methodNotAllowed, corsSimplePreflight, asyncHandler } from 'http-util';

export default (app, checkPermission) => {
  app.options('/company', corsSimplePreflight('GET,HEAD,POST,PATCH,DELETE'));
  app.options('/company/enable', corsSimplePreflight('POST'));
  app.options('/company/enable/:uuid', corsSimplePreflight('POST'));
  app.options('/company/disable', corsSimplePreflight('POST'));
  app.options('/company/disable/:uuid', corsSimplePreflight('POST'));
  app.options('/company/:uuid', corsSimplePreflight('GET,PATCH,DELETE'));

  app.post('/company', checkPermission('company.create'), asyncHandler(CompanyController, 'post'));
  app.get('/company', checkPermission('company.get'), asyncHandler(CompanyController, 'get'));

  app.get('/company/:uuid', checkPermission('company.get'), asyncHandler(CompanyController, 'get'));

  app.delete('/company', checkPermission('company.delete'), asyncHandler(CompanyController, 'delete'));
  app.delete('/company/:uuid', checkPermission('company.delete'), asyncHandler(CompanyController, 'delete'));

  app.post('/company/enable', checkPermission('company.edit'), asyncHandler(CompanyController, 'enablePost'));
  app.post('/company/enable/:uuid', checkPermission('company.edit'), asyncHandler(CompanyController, 'enablePost'));
    
  app.post('/company/disable', checkPermission('company.edit'), asyncHandler(CompanyController, 'disablePost'));
  app.post('/company/disable/:uuid', checkPermission('company.edit'), asyncHandler(CompanyController, 'disablePost'));

  app.patch('/company', checkPermission('company.edit'), asyncHandler(CompanyController, 'patch'));
  app.patch('/company/:uuid', checkPermission('company.edit'), asyncHandler(CompanyController, 'patch'));

  app.all('/company', methodNotAllowed);
};