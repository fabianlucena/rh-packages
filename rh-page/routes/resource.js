import {ResourceController} from '../controllers/resource.js';
import {corsSimplePreflight, asyncHandler, methodNotAllowed} from 'http-util';

export default (app) => {
    app.options('/resource', corsSimplePreflight('GET'));
    app.get('/resource/:name', asyncHandler(ResourceController, 'get'));
    app.all('/resource', methodNotAllowed);
};