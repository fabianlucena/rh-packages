let rt = require('../../rh-test');
let {agent} = require('./index');
const chai = require('chai');
const expect = chai.expect;

let headers = {};

describe('Login', () => {
    rt.testEndPoint({
        agent: agent,
        url: '/api/login',
        notAllowedMethods: 'HEAD,PUT,DELETE,PATCH,OPTIONS',
        get: [
            'noParametersError',
            {
                $form: true,
                haveProperties: ['username', 'password']
            },
        ],
        post: {
            parameters: {
                username: 'admin',
                password: '1234'
            },
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
                    title: '"Invalid credentials" login error',
                    parameters: {
                        username: 'admin',
                        password: '12345'
                    },        
                    status: 403,
                    haveProperties: 'error',
                    propertyContains: {
                        message: 'Invalid credentials'
                    }
                },
                {
                    title: 'login should returns a valid session authToken',
                    status: 201,
                    haveProperties: ['authToken', 'index'],
                    after: res => headers.Authorization = `Bearer ${res.body.authToken}`, // after succesfull test, store the authToken for reuse as authorization header
                },
                {
                    title: 'should returns a distinct valid session authToken',
                    status: 201,
                    haveProperties: ['authToken', 'index'],
                    after: res => expect(headers.Authorization).to.be.not.equals(`Bearer ${res.body.authToken}`), // after succesfull test, use a custom check to verify the authToken
                },
            ]
        }
    });
});

describe('Logout', () => {
    before(function () {
        if (!headers?.Authorization)
            this.skip();
    });

    rt.testEndPoint({
        agent: agent,
        url: '/api/logout',
        notAllowedMethods: 'HEAD,PUT,POST,DELETE,PATCH,OPTIONS',
        headers: headers,
        get: [
            {
                title: 'valid logout should return a HTTP error 204',
                status: 204,
                empty: true,
            },
            {
                title: 'duplicate logout should return a HTTP error 403',
                status: 403,
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
});