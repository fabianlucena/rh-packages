const UserService = require('../services/user');
const Identity = require('../services/identity');
const Session = require('../services/session');
const ru = require('rofa-util');

const LoginService = {
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
    async loginForUsernamePasswordAndDeviceId(username, password, deviceId, sessionIndex, locale) {
        if (!deviceId)
            throw new ru._Error('There is no device to create session');
        
        const user = await UserService.getForUsername(username);
        if (!user)
            throw new ru._Error('Error to get user to create session');

        await UserService.checkEnabledUser(user, username);
        if (!await Identity.checkLocalPasswordForUsername(username, password, locale))
            throw new ru._Error('Invalid credentials');

        return Session.create({
            deviceId: deviceId,
            userId: user.id,
            index: sessionIndex,
            open: Date.now(),
        });
    },
};

module.exports = LoginService;