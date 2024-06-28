import { rt } from 'rh-test';

export const credentials = {
  username: 'admin',
  password: '1234'
};

describe('Login for Access module testing', () => {
  before(function () {
    if (!rt.hasModule('rhAccess'))
      this.skip();
  });

  rt.autoLogin({ credentials });
});
