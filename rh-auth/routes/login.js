module.exports = (app, checkPermission) => {
   const loginController = require('../controllers/login');
   const httpUtil = require('http-util');
   
   app.get('/login', checkPermission('login'), loginController.loginGetForm);
   app.post('/login', checkPermission('login'), loginController.loginPost);
   app.all('/login', httpUtil.methodNotAllowed);
};