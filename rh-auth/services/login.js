import { UserService } from '../services/user.js';
import { DeviceService } from '../services/device.js';
import { IdentityService } from '../services/identity.js';
import { SessionService } from '../services/session.js';
import { HttpError } from 'http-util';
import { InvalidDeviceError, InvalidTokenError, NoOldSessionError, NoUserError } from './errors.js';

export class LoginService {
  static singleton() {
    if (!this.singletonInstance) {
      this.singletonInstance = new this();
    }

    return this.singletonInstance;
  }

  /**
   * Perform the login for username and password, in a given device.
   * @param {string} username 
   * @param {string} password 
   * @param {number} deviceId 
   * @param {string} sessionIndex 
   * @returns {Promise[{
   *  deviceId: integer,
   *  userId: integer,
   *  index: sessionIndex,
   *  open: Date.now(),
   * }]}
   */
  async forUsernamePasswordDeviceTokenAndSessionIndex(username, password, deviceToken, sessionIndex, loc) {
    const userService = UserService.singleton();

    const user = await userService.getSingleForUsername(username);
    if (!user) {
      throw new NoUserError(loc => loc._c('login', 'Error to get user to create session'));
    }

    await userService.checkEnabledUser(user, username);
    const checkPasswordResult = await IdentityService.singleton().checkLocalPasswordForUsername(username, password, loc);
    if (checkPasswordResult !== true) {
      throw new HttpError('Invalid login', 403);
    }

    const deviceService = DeviceService.singleton();
    let device;
    if (deviceToken) {
      device = await deviceService.getForToken(deviceToken);
      if (!device) {
        throw new HttpError('Invalid device', 400);                
      }
    }
    
    if (!device) {
      device = await deviceService.create({ data: '' });
    }

    const session = await SessionService.singleton().create({
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
   * @returns {Promise[{
  *  deviceId: integer,
  *  userId: integer,
  *  index: sessionIndex,
  *  open: Date.now(),
  * }]}
  */
  async forAutoLoginTokenAndSessionIndex(autoLoginToken, deviceToken, sessionIndex) {
    const sessionService = SessionService.singleton();

    const oldSession = await sessionService.getForAutoLoginToken(autoLoginToken);
    if (!oldSession) {
      throw new NoOldSessionError(loc => loc._c('login', 'Error to get old session to create session'));
    }

    if (oldSession.close) {
      throw new InvalidTokenError(loc => loc._c('login', 'The auto login token is invalid because the session is closed'));
    }

    const device = await DeviceService.singleton().getForToken(deviceToken);
    if (!device) {
      throw new HttpError('Invalid device', 400);
    }

    if (oldSession.deviceId != device.id) {
      throw new InvalidDeviceError(loc => loc._c('login', 'The device is not the same'));
    }

    const userService = UserService.singleton();
    const user = await userService.getSingleForId(oldSession.userId);
    await userService.checkEnabledUser(user, user.username);

    await sessionService.closeForId(oldSession.id);

    const session = await sessionService.create({
      deviceId: device.id,
      userId: oldSession.userId,
      index: sessionIndex,
      open: Date.now(),
      oldSessionId: oldSession.id,
    });

    return {
      id: session.id,
      index: session.index,
      authToken: session.authToken,
      deviceToken: device.token,
      autoLoginToken: session.autoLoginToken,
      oldSessionId: oldSession.id,
    };
  }
}