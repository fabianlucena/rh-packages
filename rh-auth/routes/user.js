module.exports = (app, checkPermission) => {
   const userController = require('../controllers/user');
   const httpUtil = require('http-util');
   const router = require('express').Router();

   app.use('/user', router)

   router.post('', checkPermission('user.create'), httpUtil.asyncHandler(userController.userPost));
   router.get('', checkPermission('user.get'), httpUtil.asyncHandler(userController.userGet));
   router.delete('', checkPermission('user.delete'), httpUtil.asyncHandler(userController.userDelete));
   router.all('', httpUtil.methodNotAllowed);
};