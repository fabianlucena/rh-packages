import {rt} from 'rh-test';

describe('Login for Access module testing', () => {
    rt.autoLogin({username: 'admin', password: '1234'});
});
