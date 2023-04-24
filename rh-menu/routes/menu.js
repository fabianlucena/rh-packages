import {MenuController} from '../controllers/menu.js';
import {corsSimplePreflight, methodNotAllowed} from 'http-util';

export default (app) => {
    app.options('/menu', corsSimplePreflight('GET'));
    app.get('/menu', MenuController.get);
    app.all('/menu', methodNotAllowed);
};