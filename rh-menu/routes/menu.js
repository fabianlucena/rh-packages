import {MenuController} from '../controllers/menu.js';
import {methodNotAllowed} from 'http-util';

export default (app) => {
    app.head('/menu', methodNotAllowed);
    app.get('/menu', MenuController.get);
    app.all('/menu', methodNotAllowed);
};