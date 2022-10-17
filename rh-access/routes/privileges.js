module.exports = (app, checkPermission) => {
    const PrivilegesController = require('../controllers/privileges');
    const httpUtil = require('http-util');
   
    app.head('/privileges', httpUtil.methodNotAllowed);
    app.get('/privileges', checkPermission('privileges'), httpUtil.asyncHandler(PrivilegesController.privilegesGet));
    app.all('/privileges', httpUtil.methodNotAllowed);
};