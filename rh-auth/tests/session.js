let rt = require('../../rh-test');
const agent = require('./agent');
const headers = require('./login');

describe('Session', () => {
    before(function () {
        if (!headers?.Authorization)
            this.skip();
    });

    rt.testEndPoint({
        agent: agent,
        url: '/api/session',
        headers: headers,
        notAllowedMethods: 'POST,PUT,PATCH,OPTIONS,HEAD',
        get: [
            {
                title: 'should get a session list',
                log: true,
            },
        ],
        delete: {
            log: true,
        },
    });
});
