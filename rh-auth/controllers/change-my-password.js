import { HttpError } from 'http-util';
import { checkParameter, checkParameterNotNullOrEmpty } from 'rf-util';
import { defaultLoc } from 'rf-locale';
import dependency from 'rf-dependency';

export class ChangeMyPasswordController {
  static async getForm(req, res) {
    checkParameter(req.query, '$form');

    const loc = req.loc ?? defaultLoc;

    res.status(200).send({
      title: await loc._c('changeMyPassword', 'Change password'),
      className: 'small one-per-line',
      action: 'change-my-password',
      method: 'post',
      fields: [
        {
          name: 'currentPassword',
          type: 'password',
          label: await loc._c('changeMyPassword', 'Current password'),
          placeholder: await loc._c('changeMyPassword', 'Type here your current password'),
        },
        {
          name: 'newPassword',
          type: 'password',
          label: await loc._c('changeMyPassword', 'New password'),
          placeholder: await loc._c('changeMyPassword', 'Type here your new password'),
        },
        {
          name: 'newPasswordConfirmation',
          type: 'password',
          label: await loc._c('changeMyPassword', 'Confirm new password'),
          placeholder: await loc._c('changeMyPassword', 'Type here your new password again to confirm'),
        },
      ]
    });
  }

  static async post(req, res) {
    checkParameter(
      req?.body,
      {
        currentPassword:         loc => loc._c('changeMyPassword', 'current password'),
        newPassword:             loc => loc._c('changeMyPassword', 'new password'),
        newPasswordConfirmation: loc => loc._c('changeMyPassword', 'new password confirmation'),
      }
    );

    const data = req.body;
    checkParameterNotNullOrEmpty(data.currentPassword,         loc => loc._c('changeMyPassword', 'current password'));
    checkParameterNotNullOrEmpty(data.newPassword,             loc => loc._c('changeMyPassword', 'new password'));
    checkParameterNotNullOrEmpty(data.newPasswordConfirmation, loc => loc._c('changeMyPassword', 'new password confirmation'));

    if (data.newPassword != data.newPasswordConfirmation) {
      throw new HttpError(loc => loc._c('changeMyPassword', 'The new password and its confirmation are distinct'), 400);
    }

    if (data.newPassword == data.currentPassword) {
      throw new HttpError(loc => loc._c('changeMyPassword', 'The new password and the current password are the same'), 400);
    }

    const identityService = dependency.get('identityService');
    const checkResult = await identityService.checkLocalPasswordForUsername(
      req.user.username,
      data.currentPassword,
      req.loc,
    );
    if (checkResult !== true) {
      throw new HttpError(checkResult || (loc => loc._c('changeMyPassword', checkResult || 'Error invalid password')), 403);
    }

    const identity = await identityService.getLocalForUsername(req.user.username);
    if (!identity) {
      throw new HttpError(checkResult || (loc => loc._c('changeMyPassword', 'Error to get local identity')), 404);
    }

    const result = await identityService.updateForId({ password: data.newPassword }, identity.id);
    if (result) {
      return res.status(204).send();
    }

    throw new HttpError(checkResult || (loc => loc._c('changeMyPassword', 'Error to change the password')), 500);
  }
}
