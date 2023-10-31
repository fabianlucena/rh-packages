import {TagController} from '../controllers/tag.js';
import {methodNotAllowed, corsSimplePreflight} from 'http-util';

export default (app, checkPermission) => {
    app.options('/tag', corsSimplePreflight('GET,HEAD'));
    app.get('/tag', checkPermission('tag.get'), TagController.get);
    app.all('/tag', methodNotAllowed);
};