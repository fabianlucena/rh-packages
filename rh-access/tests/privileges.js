import './auto_login.js';
import { rt } from 'rh-test';

describe('Privileges', () => {
  before(function () {
    if (!rt.includesModule('rhAccess') || !rt.headers?.Authorization) {
      this.skip();
    }
  });

  describe('General behavior', () => {
    rt.testEndPoint({
      url: '/privileges',
      notAllowedMethods: 'POST,PUT,PATCH,DELETE',
      get: [
        {
          title: 'must return the user\'s privileges',
          status: 200,
          checkItem: ['rows', 0],
          haveProperties: ['sites', 'site', 'roles', 'permissions', 'groups', 'username', 'displayName'],
        },
      ],
    });
  });
});
