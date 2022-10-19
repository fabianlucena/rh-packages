require('./login');
const rt = require('rh-test');

describe('Session', () => {
    before(function () {
        if (!rt.headers?.Authorization)
            this.skip();
    });

    let sessionToDelete;

    rt.testEndPoint({
        url: '/session',
        notAllowedMethods: 'POST,PUT,PATCH,OPTIONS,HEAD',
        get: [
            {
                title: 'should get a session list',
                status: 200,
                checkItem: 0,
                haveProperties: ['uuid', 'index', 'open', 'close', 'User', 'Device'],
                after: res => sessionToDelete = res.body[0].uuid,
            },
        ],
        delete: {
            query: {uuid: ''},
            send: [
                'noQueryError',
                {missingQuery: 'uuid'},
                {
                    query: {uuid: 'Invalud UUID'},
                    title: 'error in UUID parameter must return an error',
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

    rt.testEndPoint({
        url: '/session',
        send: [
            {
                title: 'should get the current session data',
                checkItem: 0,
                haveProperties: ['uuid', 'index', 'open', 'close', 'User', 'Device'],
                before: test => test.query.authToken = test.headers.Authorization.substring(7),
                after: res => sessionToDelete = res.body[0].uuid,
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
