import './login.js';
import {rt} from 'rh-test';

describe('User', () => {
    before(function () {
        if (!rt.headers?.Authorization)
            this.skip();
    });

    rt.testGeneralBehaviorEndPoint({
        url: '/user',
        notAllowedMethods: 'PUT,OPTIONS,HEAD',
        parameters: {
            username: 'test1',
            displayName: 'Test 1',
            password: 'abc123',
        },
        missingParameters: [
            ['username'],
            ['displayName'],
            ['username','displayName'],
        ],
        forbiddenDoubleCreation: true,
        getProperties: ['uuid', 'isEnabled', 'username', 'displayName', 'UserType'],
        getCreated: {query:{username:'test1'}},
        getSingleByQuery: ['username', 'uuid'],
        getSingleByUrl: ['uuid'],
        patchParameters: {
            displayName: 'New display name',
        },
    });

    describe('Specific behavior', () => {
        rt.testEndPoint({
            url: '/user',
            title: 'create a new user',
            post: true,
            parameters: {
                username: 'test2',
                displayName: 'Test 2',
                password: 'abc123',
            },
        });

        let testUser;
        rt.testEndPoint({
            url: '/user',
            get: {
                title: 'GET should get the recently create objects',
                query: {username: 'test2'},
                bodyLengthOf: 1,
                after: res => testUser = res.body[0],
            },
        });

        rt.testLogin({
            agent: rt.createRequest(),
            username: 'test2',
            password: 'abc123',
        });

        rt.testEndPoint({
            url: '/user/disable',
            title: 'POST disable the user',
            post: {
                before: test => test.url += '/' + testUser.uuid,
            },
        });

        rt.testLogin({
            agent: rt.createRequest(),
            title: 'Try login with the disabled user',
            username: 'test2',
            password: 'abc123',
            status: 403,
            haveProperties: ['error', 'message'],
        });

        rt.testEndPoint({
            url: '/user/enable',
            title: 'POST enable the user',
            post: {
                before: test => test.url += '/' + testUser.uuid,
            },
        });

        rt.testLogin({
            agent: rt.createRequest(),
            username: 'test2',
            password: 'abc123',
        });

        rt.testEndPoint({
            url: '/user',
            title: 'POST delete the user',
            delete: {
                before: test => test.url += '/' + testUser.uuid,
            },
        });

        rt.testLogin({
            agent: rt.createRequest(),
            title: 'Try login with the deleted user',
            username: 'test2',
            password: 'abc123',
            status: 403,
            haveProperties: ['error', 'message'],
        });
    });
});
