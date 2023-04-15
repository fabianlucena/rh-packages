import {rt} from 'rh-test';
import {cookies as htCookies} from 'http-util';
import chai from 'chai';

describe('Device', () => {
    let cookies = {};

    rt.testEndPoint({
        url: '/not-found',
        headers: {},
        get: [
            {   
                title: 'should get a value for cookie device',
                status: null,
                haveCookies: 'device',
                before: test => test.agent = rt.initAgent(),
                after: res => cookies.device = htCookies(res, 'device', 'value'), // after succesfull test, store the cookie
            },
            {
                title: 'should not get a cookie device',
                status: null,
                noHaveCookies: 'device',
            },
            {
                agent: chai.request(rt.app),
                title: 'should get a distinct cookie device',
                status: null,
                haveCookies: 'device',
                before: test => test.noHaveCookies = {device: cookies.device},  // before send this request update the test for check the cookie distint to the stored one
            },
        ]
    });
});
