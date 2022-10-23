module.exports = (app, checkPermission) => {
    const userController = require('../controllers/user');
    const httpUtil = require('http-util');

    app.head('/user', httpUtil.methodNotAllowed);
    app.post('/user', checkPermission('user.create'), httpUtil.asyncHandler(userController.userPost));
    app.get('/user', checkPermission('user.get'), httpUtil.asyncHandler(userController.userGet));
    app.get('/user/:uuid', checkPermission('user.get'), httpUtil.asyncHandler(userController.userGet));
    app.delete('/user', checkPermission('user.delete'), httpUtil.asyncHandler(userController.userDelete));
    app.delete('/user/:uuid', checkPermission('user.get'), httpUtil.asyncHandler(userController.userDelete));
    app.post('/user/enable', checkPermission('user.update'), httpUtil.asyncHandler(userController.userEnablePost));
    app.post('/user/enable/:uuid', checkPermission('user.update'), httpUtil.asyncHandler(userController.userEnablePost));
    app.post('/user/disable', checkPermission('user.update'), httpUtil.asyncHandler(userController.userDisablePost));
    app.post('/user/disable/:uuid', checkPermission('user.update'), httpUtil.asyncHandler(userController.userDisablePost));
    app.all('/user', httpUtil.methodNotAllowed);
};