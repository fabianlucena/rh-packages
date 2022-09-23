module.exports = (app, checkPermission) => {
   const siteController = require('../controllers/site');
   const httpUtil = require('http-util');

   app.post('/switch-site', checkPermission('current-site.switch'), siteController.switchSitePost);
   app.all('/switch-site', httpUtil.methodNotAllowed);
   
   app.get('/current-site', checkPermission('current-site.get'), siteController.currentSiteGet);
   app.all('/current-site', httpUtil.methodNotAllowed);

   app.get('/site', checkPermission('site.get'), siteController.siteGet);
   app.all('/site', httpUtil.methodNotAllowed);
};