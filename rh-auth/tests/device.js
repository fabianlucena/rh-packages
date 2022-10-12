let rt = require('../../rh-test');
const app = require('./app');
const agent = require('./agent');
const httpUtil = require('http-util');
const chai = require('chai');

let cookies = {};

describe('Device', () => {
    rt.testEndPoint({
        agent: agent,
        url: '/api/not-found',
        get: [
            {
                title: 'should get a value for cookie device',
                haveCookies: 'device',
                after: res => cookies.device = httpUtil.cookies(res, 'device', 'value') // after succesfull test, store the cookie
            },
            {
                title: 'should not get a cookie device',
                noHaveCookies: 'device',
            },
            {
                agent: chai.request(app),
                title: 'should get a distinct cookie device',
                haveCookies: 'device',
                before: test => test.noHaveCookies = {device: cookies.device},  // before send this request update the test for check the cookie distint to the stored one
            },
        ]
    });
});
