import {BranchSelectController} from '../controllers/branch-select.js';
import {methodNotAllowed, corsSimplePreflight, asyncHandler} from 'http-util';

export default (app, checkPermission) => {
    app.options('/branch-select', corsSimplePreflight('GET,HEAD,POST'));
    app.get('/branch-select', checkPermission('branch-select.switch'), asyncHandler(BranchSelectController, 'get'));
    app.post('/branch-select', checkPermission('branch-select.switch'), asyncHandler(BranchSelectController, 'post'));
    app.all('/branch-select', methodNotAllowed);
};