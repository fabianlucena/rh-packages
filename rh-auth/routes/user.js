module.exports = (app, checkPermission) => {
    const userController = require('../controllers/user');
    const httpUtil = require('http-util');

    app.post('/user', checkPermission('user.create'), httpUtil.asyncHandler(userController.userPost));
    app.get('/user', checkPermission('user.get'), httpUtil.asyncHandler(userController.userGet));
    app.delete('/user', checkPermission('user.delete'), httpUtil.asyncHandler(userController.userDelete));
    app.all('/user', httpUtil.methodNotAllowed);
};