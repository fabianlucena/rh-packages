import { credentials } from './auto_login.js';
import { rt } from 'rh-test';

describe('Session', () => {
  before(function () {
    if (!rt.includesModule('rhAuth') || !rt.headers?.Authorization) {
      this.skip();
    }
  });

  let sessionToDelete;

  // TODO: Add test for get my own sessions
  describe('General behavior', () => {
    rt.testEndPoint({
      url: '/session',
      notAllowedMethods: 'POST,PUT,PATCH',
      get: [
        '$grid',
        {
          title: 'should get a session list',
          checkItem: ['rows', 0],
          haveProperties: ['uuid', 'index', 'open', 'close', 'user', 'device'],
          after: res => sessionToDelete = res.body.rows[0].uuid,
        },
      ],
      delete: {
        query: { uuid: '' },
        send: [
          'noQueryError',
          { missingQuery: 'uuid' },
          {
            title: 'error in UUID parameter must return an error',
            query: { uuid: 'Invalid UUID' },
            status: 400,
            haveProperties: 'error,message',
          },
          {
            title: 'delete the first session listed',
            before: test => test.query.uuid = sessionToDelete,
          },
          {
            title: 'trying delete a second time the same record must return an error',
            before: test => test.query.uuid = sessionToDelete,
            status: 404,
            haveProperties: 'error,message',
          },
        ],
      },
    });
  });

  describe('Delete the current session', () => {
    rt.autoLogin({ credentials });

    rt.testEndPoint({
      url: '/session',
      send: [
        {
          title: 'should get the current session data',
          checkItem: ['rows', 0],
          haveProperties: ['uuid', 'index', 'open', 'close', 'user', 'device'],
          before: test => test.query.authToken = test.headers.Authorization.substring(7),
          after: res => sessionToDelete = res.body.rows[0].uuid,
        },
        {
          title: 'delete the current session',
          method: 'delete',
          before: test => test.query.uuid = sessionToDelete,
        },
        {
          title: 'should get an error because the session now is invalid',
          status: 401,
        },
      ],
    });
  });
});
