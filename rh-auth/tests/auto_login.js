import {rt} from 'rh-test';

export const credentials = {
    username: 'admin',
    password: '1234'
};

describe('Login for Auth module testing', () => {
    before(function () {
        if (!rt.hasModule('rhAuth'))
            this.skip();
    });

    rt.autoLogin({credentials});
});
