import {LocaleController} from '../controllers/locale.js';
import {corsSimplePreflight, methodNotAllowed} from 'http-util';

export default (app) => {
    app.options('/locale', corsSimplePreflight('POST'));
    app.post('/locale', LocaleController.post);
    app.all('/locale', methodNotAllowed);
};