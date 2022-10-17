require('./login');
const rt = require('rh-test');

describe('Privileges', () => {
    before(function () {
        if (!rt.headers?.Authorization)
            this.skip('No authorization headers');
    });

    rt.testEndPoint({
        url: '/privileges',
        notAllowedMethods: 'POST,PATCH,DELETE,OPTIONS,HEAD',
        get: [
            {
                title: 'musth return the user\'s privileges',
                status: 200,
                log: true,
            },
        ],
    });
});
