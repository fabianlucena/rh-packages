import {UserService} from '../services/user.js';
import {IdentityService} from '../services/identity.js';
import {SessionService} from '../services/session.js';
import {_Error} from 'rofa-util';
import {HttpError} from 'http-util';

export class LoginService {
    /**
     * Perform the login for username and password, in a given device.
     * @param {string} username 
     * @param {string} password 
     * @param {number} deviceId 
     * @param {string} sessionIndex 
     * @returns {Promise{
     *  deviceId: integer,
     *  userId: integer,
     *  index: sessionIndex,
     *  open: Date.now(),
     * }}
     */
    static async forUsernamePasswordAndDeviceId(username, password, deviceId, sessionIndex, locale) {
        if (!deviceId)
            throw new _Error('There is no device to create session');
        
        const user = await UserService.getForUsername(username);
        if (!user)
            throw new _Error('Error to get user to create session');

        await UserService.checkEnabledUser(user, username);
        if (!await IdentityService.checkLocalPasswordForUsername(username, password, locale))
            throw new HttpError('Invalid login', 403);

        return SessionService.create({
            deviceId: deviceId,
            userId: user.id,
            index: sessionIndex,
            open: Date.now(),
        });
    }
}