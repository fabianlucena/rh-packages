require('./login');
const rt = require('rh-test');

describe('Session', () => {
    before(function () {
        if (!rt.headers?.Authorization)
            this.skip();
    });

    rt.testEndPoint({
        url: '/session',
        notAllowedMethods: 'POST,PUT,PATCH,OPTIONS,HEAD',
        get: [
            {
                skip: true,
                title: 'should get a session list',
                log: true,
            },
        ],
        delete: {
            skip: true,
            log: true,
        },
    });
});
