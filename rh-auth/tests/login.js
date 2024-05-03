import { credentials } from './auto_login.js';
import { rt } from 'rh-test';
import chai from 'chai';

const expect = chai.expect;

describe('Login', () => {
  before(function () {
    if (!rt.hasModule('rhAuth')) {
      this.skip();
    }

    rt.headers.Authorization = null;
  });

  describe('General behavior', () => {
    rt.testEndPoint({
      url: '/login',
      notAllowedMethods: 'PUT,DELETE,PATCH',
      headers: { Authorization: null },
      get: [
        'noParametersError',
        {
          $form: true,
          haveProperties: ['action', 'fields'],
        },
      ],
    });
  });
        
  describe('Login', () => {
    rt.testEndPoint({
      url: '/login',        
      post: {
        parameters: credentials,
        send: [
          'noParametersError',
          {
            missingParameters: [
              ['username', 'password'],
              ['username'],
              ['password']
            ]
          },
          {
            title: '"Invalid login" login error',
            parameters: {
              username: 'admin',
              password: '12345'
            },        
            status: 403,
            haveProperties: 'error',
            propertyContains: {
              message: 'Invalid login'
            }
          },
          {
            title: 'login should returns a valid session authToken',
            status: 201,
            haveProperties: ['authToken', 'index'],
            after: res => rt.headers.Authorization = `Bearer ${res.body.authToken}`, // after succesfull test, store the authToken for reuse as authorization header
          },
          {
            title: 'should returns a distinct valid session authToken',
            status: 201,
            haveProperties: ['authToken', 'index'],
            after: res => expect(rt.headers.Authorization).to.be.not.equals(`Bearer ${res.body.authToken}`), // after succesfull test, use a custom check to verify the authToken
          },
        ]
      }
    });
  });

  describe('Logout', () => {
    const localHeaders = {};

    before(function () {
      if (!rt.headers?.Authorization)
        this.skip();

      localHeaders.Authorization = rt.headers.Authorization;
    });

    rt.testEndPoint({
      url: '/logout',
      notAllowedMethods: 'GET,PUT,PATCH,DELETE,HEAD',
      post: [
        {
          title: 'valid logout should return a HTTP error 204',
          status: 204,
          empty: true,
          after: () => {if (rt.headers?.Authorization) delete rt.headers.Authorization;},
        },
        {
          headers: localHeaders,
          title: 'duplicate logout should return a HTTP error 403',
          status: 401,
          haveProperties: 'error',
        },
        {
          title: 'logout without authorization should return a HTTP error 401',
          headers: null,
          status: 401,
          haveProperties: 'error',
        },
      ]
    });

    rt.autoLogin({ credentials });
  });
});
