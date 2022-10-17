const rt = require('rh-test');

describe.only('Login for Access module testing', () => {
    rt.autoLogin({username: 'admin', password: '1234'});
});
