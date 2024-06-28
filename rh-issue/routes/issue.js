import { IssueController } from '../controllers/issue.js';
import { methodNotAllowed, corsSimplePreflight, asyncHandler } from 'http-util';

export default (app, checkPermission) => {
  app.options('/issue', corsSimplePreflight('GET,HEAD,POST,PATCH,DELETE'));
  app.options('/issue/project', corsSimplePreflight('GET,HEAD'));
  app.options('/issue/type', corsSimplePreflight('GET,HEAD'));
  app.options('/issue/priority', corsSimplePreflight('GET,HEAD'));
  app.options('/issue/close-reason', corsSimplePreflight('GET,HEAD'));
  app.options('/issue/status', corsSimplePreflight('GET,HEAD'));
  app.options('/issue/workflow', corsSimplePreflight('GET,HEAD'));
  app.options('/issue/transition', corsSimplePreflight('GET,HEAD'));
  app.options('/issue/close-reason', corsSimplePreflight('GET,HEAD'));
  app.options('/issue/enable', corsSimplePreflight('POST'));
  app.options('/issue/enable/:uuid', corsSimplePreflight('POST'));
  app.options('/issue/disable', corsSimplePreflight('POST'));
  app.options('/issue/disable/:uuid', corsSimplePreflight('POST'));
  app.options('/issue/:uuid', corsSimplePreflight('GET,PATCH,DELETE'));

  app.post('/issue', checkPermission('issue.create'), asyncHandler(IssueController, 'post'));
  app.get('/issue', checkPermission('issue.get'), asyncHandler(IssueController, 'get'));
  app.get('/issue/project', checkPermission('issue.edit'), asyncHandler(IssueController, 'getProject'));
  app.get('/issue/type', checkPermission('issue.edit'), asyncHandler(IssueController, 'getType'));
  app.get('/issue/priority', checkPermission('issue.edit'), asyncHandler(IssueController, 'getPriority'));
  app.get('/issue/close-reason', checkPermission('issue.edit'), asyncHandler(IssueController, 'getCloseReason'));
  app.get('/issue/status', checkPermission('issue.edit'), asyncHandler(IssueController, 'getStatus'));
  app.get('/issue/workflow', checkPermission('issue.edit'), asyncHandler(IssueController, 'getWorkflow'));
  app.get('/issue/transition', checkPermission('issue.edit'), asyncHandler(IssueController, 'getTransition'));
  app.get('/issue/close-reason', checkPermission('issue.edit'), asyncHandler(IssueController, 'getCloseReason'));

  app.get('/issue/:uuid', checkPermission('issue.get'), asyncHandler(IssueController, 'get'));

  app.delete('/issue', checkPermission('issue.delete'), asyncHandler(IssueController, 'delete'));
  app.delete('/issue/:uuid', checkPermission('issue.delete'), asyncHandler(IssueController, 'delete'));

  app.post('/issue/enable', checkPermission('issue.edit'), asyncHandler(IssueController, 'enablePost'));
  app.post('/issue/enable/:uuid', checkPermission('issue.edit'), asyncHandler(IssueController, 'enablePost'));
    
  app.post('/issue/disable', checkPermission('issue.edit'), asyncHandler(IssueController, 'disablePost'));
  app.post('/issue/disable/:uuid', checkPermission('issue.edit'), asyncHandler(IssueController, 'disablePost'));

  app.patch('/issue', checkPermission('issue.edit'), asyncHandler(IssueController, 'patch'));
  app.patch('/issue/:uuid', checkPermission('issue.edit'), asyncHandler(IssueController, 'patch'));

  app.all('/issue', methodNotAllowed);
};