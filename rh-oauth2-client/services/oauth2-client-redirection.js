import { MissingParameterError } from 'rf-util';
import { ForbiddenError, HttpError, NotFoundError } from 'http-util';
import { defaultLoc } from 'rf-locale';
import dependency from 'rf-dependency';

function replace(obj, replacements) {
  const result = {};
  for (const key in obj) {
    let value = obj[key];
    for (const token in replacements) {
      if (value.includes(token)) {
        value = value.replace(token, replacements[token]);
      }
    }

    result[key] = value;
  }

  return result;
}

export class OAuth2ClientRedirectionService {
  constructor() {
    this.log =                 dependency.get('log');
    this.oAuth2ClientService = dependency.get('oAuth2ClientService');
    this.oAuth2StateService =  dependency.get('oAuth2StateService');
    this.identityService =     dependency.get('identityService');
    this.userService =         dependency.get('userService');
    this.deviceService =       dependency.get('deviceService', null);
    this.sessionService =      dependency.get('sessionService');
  }

  async getOAuth2ClientForData(data) {
    const oAuth2Client = await this.oAuth2ClientService.getForName(data.name);
    if (!oAuth2Client) {
      throw new NotFoundError(await data.loc._c('oauth2Client', 'Client %s not found', data.name));
    }

    return oAuth2Client;
  }

  async getParsedStateFromData(data) {
    const result = {};
    const stateParts = data.state.split(',');
    if (stateParts.length !== 3) {
      throw new HttpError(await data.loc._c('oauth2Client', 'Wrong state format must be 3 values comma separated.'));
    }

    result.sessionIndex = stateParts[0];
    result.deviceToken = stateParts[1];
    result.state = stateParts[2];

    return result;
  }

  async getOAuth2StateForOAuth2ClientAndData(oAuth2Client, data) {
    const oAuth2State = await this.oAuth2StateService.getSingleFor({
      oAuth2ClientId: oAuth2Client.id,
      state: data.state,
    });
    if (!oAuth2State) {
      throw new NotFoundError(await data.loc._c('oauth2Client', 'State %s does not exis in client', data.state, data.name));
    }
  }

  async getGetTokenBodyForOAuth2ClientAndData(oAuth2Client, data) {
    const getTokenBody = JSON.parse(oAuth2Client.getTokenBody);
    const replacements = {
      '{code}':         data.code,
      '{clientId}':     oAuth2Client.clientId,
      '{clientSecret}': oAuth2Client.clientSecret,
      '{protocolHost}': data.protocolHost ?? (data.protocol + '//' + data.host),
    };
    const body = replace(getTokenBody, replacements);

    return body;
  }

  async getTokenDataFromCodeForOAuth2ClientAndData(oAuth2Client, data) {
    const body = await this.getGetTokenBodyForOAuth2ClientAndData(oAuth2Client, data);
    const res = await fetch(oAuth2Client.getTokenURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(body)
    });
    if (!res.ok) {
      this.log.error('Error to get token from code');
      this.log.error({ body });
      throw new ForbiddenError(await data.loc._c('Error to get token from code.'));
    }

    return res.json();
  }

  async getUserInfoDataForOAuth2ClientAndTokenData(oAuth2Client, tokenData) {
    const res = await fetch(oAuth2Client.getUserInfoURL, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + tokenData[oAuth2Client.authorizationBearerProperty]
      },
    });
    return res.json();
  }

  async getOrCreateUserForOAuth2ClientAndUserInfoData(oAuth2Client, userInfoData) {
    const username = userInfoData[oAuth2Client.userInfoUsernameProperty];
    let identity = await this.identityService.getForUsernameIdentityAndTypeNameOrNull(
      username,
      oAuth2Client.name,
    );
    if (!identity) {
      if (!oAuth2Client.createUserIfNotExists) {
        return;
      }

      let user = await this.userService.getForUsernameOrNull(username);
      if (!user) {
        const displayName = userInfoData[oAuth2Client.userInfoDisplayNameProperty];
        user = await this.userService.create({
          username,
          displayName,
          type: 'user',
        });
      }

      identity = await this.identityService.create({
        userId: user.id,
        type: oAuth2Client.name,
        data: `{"username":"${username}"}`,
      });

      if (!identity) {
        return;
      }
      
      return user;
    }

    return await this.userService.getSingleForId(identity.userId);
  }

  async loginFromCode(data, options) {
    if (!data.code) {
      throw new MissingParameterError('code');
    }

    if (!data.scope) {
      throw new MissingParameterError('scope');
    }

    if (!data.name) {
      throw new MissingParameterError('name');
    }

    const loc = options.loc ?? defaultLoc;
    data = { ...data, loc };
    const oAuth2Client = await this.getOAuth2ClientForData(data);
    Object.assign(data, await this.getParsedStateFromData(data));
    await this.getOAuth2StateForOAuth2ClientAndData(oAuth2Client, data);
    const tokenData = await this.getTokenDataFromCodeForOAuth2ClientAndData(oAuth2Client, data);
    const userInfoData = await this.getUserInfoDataForOAuth2ClientAndTokenData(oAuth2Client, tokenData);

    const user = await this.getOrCreateUserForOAuth2ClientAndUserInfoData(oAuth2Client, userInfoData);
    if (!user) {
      throw new ForbiddenError(await loc._c('You do not have permission to access this system.'));
    }

    let device;
    if (this.deviceService) {
      device = await this.deviceService.getForTokenOrCreateNew(data.deviceToken);
    }
    
    const session = await this.sessionService.create({
      deviceId: device?.id,
      userId: user.id,
      index: data.sessionIndex,
      open: Date.now(),
    });

    return {
      id: session.id,
      index: session.index,
      authToken: session.authToken,
      deviceToken: device.token,
      autoLoginToken: session.autoLoginToken,
      reloadMenu: true,
      redirectTo: '/',
    };
  }
}