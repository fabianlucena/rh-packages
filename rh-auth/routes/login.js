module.exports = (app, checkPermission) => {
    const loginController = require('../controllers/login');
    const httpUtil = require('http-util');
    
    app.head('/login', httpUtil.methodNotAllowed);
    app.get('/login', checkPermission('login'), httpUtil.asyncHandler(loginController.loginGetForm));
    app.post('/login', checkPermission('login'), httpUtil.asyncHandler(loginController.loginPost));
    app.all('/login', httpUtil.methodNotAllowed);
};