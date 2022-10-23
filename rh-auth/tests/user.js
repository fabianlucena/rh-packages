require('./login');
const rt = require('rh-test');

describe('User', () => {
    before(function () {
        if (!rt.headers?.Authorization)
            this.skip();
    });

    

    rt.testGeneralBehaviorEndPoint({
        url: '/user',
        notAllowedMethods: 'PUT,PATCH,OPTIONS,HEAD',
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

        rt.autoLogin({
            username: 'test2',
            password: 'abc123',
            agent: rt.createAgent(),
        });

        rt.testEndPoint({
            url: '/user/disable',
            title: 'POST disable the user',
            post: {
                before: test => test.url += '/' + testUser.uuid,
            },
        });

        rt.testEndPoint({
            url: '/login',
            agent: rt.createAgent(),
            post: {
                title: 'Login with the disabled user',
                parameters: {
                    username: 'test2',
                    password: 'abc123',
                },
                status: 201,
                haveProperties: ['authToken', 'index'],
            },
        });

        rt.autoLogin({
            username: 'test2',
            password: 'abc123',
            agent: rt.createAgent(),
        });

        rt.testEndPoint({
            url: '/user',
            title: 'should create a new user',
            skip: true,
            send: [
                {title: 'Enable user'},
                {title: 'Login with disable user'},
                {title: 'Login with reenable user'},
                {title: 'Login with deleted user'},
                {title: 'Delete user and check access'},
                {title: 'Change display name'},
            ],
        });
    });
});
