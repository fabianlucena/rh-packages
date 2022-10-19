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
            title: 'delete the first session listed',
            before: test => test.query.uuid = sessionToDelete,
            log: true,
            requestLog: true,
        },
    });
});
