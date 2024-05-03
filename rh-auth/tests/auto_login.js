import { rt } from 'rh-test';

export const credentials = {
  username: 'admin',
  password: '1234'
};

describe('Autologin', () => {
  before(function () {
    if (!rt.hasModule('rhAuth') || !rt.headers?.Authorization)
      this.skip();
  });

  describe('Login for Auth module testing', () => {
    before(function () {
      if (!rt.hasModule('rhAuth'))
        this.skip();
    });

    rt.autoLogin({ credentials });
  });
});
