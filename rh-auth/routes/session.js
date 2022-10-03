module.exports = (app, checkPermission) => {
    const sessionController = require('../controllers/session');
    const httpUtil = require('http-util');

    app.get('/session', checkPermission('ownsession.get', 'session.get'), httpUtil.asyncHandler(sessionController.sessionGet));
    app.delete('/session', checkPermission('session.delete'), httpUtil.asyncHandler(sessionController.sessionDelete));
    app.all('/session', httpUtil.methodNotAllowed);
};