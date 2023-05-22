import {UserService} from '../services/user.js';
import {DeviceService} from '../services/device.js';
import {IdentityService} from '../services/identity.js';
import {SessionService} from '../services/session.js';
import {_Error} from 'rf-util';
import {HttpError} from 'http-util';
import {loc} from 'rf-locale';

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
    static async forUsernamePasswordDeviceTokenAndSessionIndex(username, password, deviceToken, sessionIndex, loc) {
        const user = await UserService.getForUsername(username);
        if (!user)
            throw new _Error(loc._f('Error to get user to create session'));

        await UserService.checkEnabledUser(user, username);
        if (!await IdentityService.checkLocalPasswordForUsername(username, password, loc))
            throw new HttpError('Invalid login', 403);

        let device;
        if (deviceToken) {
            device = await DeviceService.getForToken(deviceToken);
            if (!device)
                throw new HttpError('Invalid device', 400);                
        }
        
        if (!device)
            device = await DeviceService.create({data: ''});

        const session = await SessionService.create({
            deviceId: device.id,
            userId: user.id,
            index: sessionIndex,
            open: Date.now(),
        });

        return {
            id: session.id,
            index: session.index,
            authToken: session.authToken,
            deviceToken: device.token,
            autoLoginToken: session.autoLoginToken,
        };
    }

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
    static async forAutoLoginTokenAndSessionIndex(autoLoginToken, deviceToken, sessionIndex) {
        const oldSession = await SessionService.getForAutoLoginToken(autoLoginToken);
        if (!oldSession)
            throw new _Error(loc._f('Error to get old session to create session'));

        if (oldSession.close)
            throw new _Error(loc._f('The auto login token is invalid becasuse the session is closed'));

        const device = await DeviceService.getForToken(deviceToken);
        if (!device)
            throw new HttpError('Invalid device', 400);

        if (oldSession.deviceId != device.id)
            throw new _Error(loc._f('The device is not the same'));

        const user = await UserService.get(oldSession.userId);
        await UserService.checkEnabledUser(user, user.username);

        await SessionService.closeForId(oldSession.id);

        const session = await SessionService.create({
            deviceId: device.id,
            userId: oldSession.userId,
            index: sessionIndex,
            open: Date.now(),
        });

        return {
            id: session.id,
            index: session.index,
            authToken: session.authToken,
            deviceToken: device.token,
            autoLoginToken: session.autoLoginToken,
        };
    }
}