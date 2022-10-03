module.exports = (app, checkPermission) => {
    const logoutController = require('../controllers/logout');
    const httpUtil = require('http-util');
    
    app.get('/logout', checkPermission('logout'), logoutController.logoutGet);
    app.all('/logout', httpUtil.methodNotAllowed);
};