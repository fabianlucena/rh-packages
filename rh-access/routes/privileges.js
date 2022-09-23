module.exports = (app, checkPermission) => {
   const PrivilegesController = require('../controllers/privileges');
   const httpUtil = require('http-util');
   
   app.get('/privileges', checkPermission('privileges'), PrivilegesController.privilegesGet);
   app.all('/privileges', httpUtil.methodNotAllowed);
};