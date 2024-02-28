import {IdentityService} from '../services/identity.js';
import {_HttpError} from 'http-util';
import {checkParameter, checkParameterNotNullOrEmpty} from 'rf-util';
import {defaultLoc} from 'rf-locale';

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
        const loc = req.loc ?? defaultLoc;
        checkParameter(
            req?.body,
            {
                currentPassword: loc._cf('changeMyPassword', 'current password'),
                newPassword: loc._cf('changeMyPassword', 'new password'),
                newPasswordConfirmation: loc._cf('changeMyPassword', 'new password confirmation'),
            }
        );

        const data = req.body;
        checkParameterNotNullOrEmpty(data.currentPassword, loc._cf('changeMyPassword', 'current password'));
        checkParameterNotNullOrEmpty(data.newPassword, loc._cf('changeMyPassword', 'new password'));
        checkParameterNotNullOrEmpty(data.newPasswordConfirmation, loc._cf('changeMyPassword', 'new password confirmation'));

        if (data.newPassword != data.newPasswordConfirmation) {
            throw new _HttpError(loc._cf('changeMyPassword', 'The new password and its confirmation are distinct'), 400);
        }

        if (data.newPassword == data.currentPassword) {
            throw new _HttpError(loc._cf('changeMyPassword', 'The new password and the current password are the same'), 400);
        }

        const identityService = IdentityService.singleton();
        const checkResult = await identityService.checkLocalPasswordForUsername(req.user.username, data.currentPassword, loc);
        if (checkResult !== true) {
            throw new _HttpError(checkResult || loc._cf('changeMyPassword', checkResult || 'Error invalid password'), 403);
        }

        const identity = await identityService.getLocalForUsername(req.user.username);
        if (!identity) {
            throw new _HttpError(checkResult || loc._cf('changeMyPassword', 'Error to get local identity'), 404);
        }

        const result = await identityService.updateForId({password: data.newPassword}, identity.id);
        if (result) {
            return res.status(204).send();
        }

        throw new _HttpError(checkResult || loc._cf('changeMyPassword', 'Error to change the password'), 500);
    }
}
