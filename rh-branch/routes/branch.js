import { BranchController } from '../controllers/branch.js';
import { methodNotAllowed, corsSimplePreflight, asyncHandler } from 'http-util';

export default (app, checkPermission) => {
  app.options('/branch', corsSimplePreflight('GET,HEAD,POST,PATCH,DELETE'));
  app.options('/branch/company', corsSimplePreflight('GET,HEAD'));
  app.options('/branch/enable', corsSimplePreflight('POST'));
  app.options('/branch/enable/:uuid', corsSimplePreflight('POST'));
  app.options('/branch/disable', corsSimplePreflight('POST'));
  app.options('/branch/disable/:uuid', corsSimplePreflight('POST'));
  app.options('/branch/:uuid', corsSimplePreflight('GET,PATCH,DELETE'));

  app.post('/branch', checkPermission('branch.create'), asyncHandler(BranchController, 'post'));
  app.get('/branch', checkPermission('branch.get'), asyncHandler(BranchController, 'get'));
  app.get('/branch/company', checkPermission('branch.edit'), asyncHandler(BranchController, 'getCompany'));

  app.get('/branch/:uuid', checkPermission('branch.get'), asyncHandler(BranchController, 'get'));

  app.delete('/branch', checkPermission('branch.delete'), asyncHandler(BranchController, 'delete'));
  app.delete('/branch/:uuid', checkPermission('branch.delete'), asyncHandler(BranchController, 'delete'));

  app.post('/branch/enable', checkPermission('branch.edit'), asyncHandler(BranchController, 'enablePost'));
  app.post('/branch/enable/:uuid', checkPermission('branch.edit'), asyncHandler(BranchController, 'enablePost'));
    
  app.post('/branch/disable', checkPermission('branch.edit'), asyncHandler(BranchController, 'disablePost'));
  app.post('/branch/disable/:uuid', checkPermission('branch.edit'), asyncHandler(BranchController, 'disablePost'));

  app.patch('/branch', checkPermission('branch.edit'), asyncHandler(BranchController, 'patch'));
  app.patch('/branch/:uuid', checkPermission('branch.edit'), asyncHandler(BranchController, 'patch'));

  app.all('/branch', methodNotAllowed);
};