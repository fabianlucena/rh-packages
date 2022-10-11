const {agent, app} = require('./index');
const httpUtil = require('http-util');
const chai = require('chai');
const expect = chai.expect;

let deviceCookie;

describe('Device', () => {
    it('should get a value for cookie device', done => {
        agent
            .get('/api/not-found')
            .end((err, res) => {
                expect(res).to.have.cookie('device');
                deviceCookie = httpUtil.cookies(res, 'device', 'value');
                done();
            });
    });

    it('should not get a cookie device', done => {
        agent
            .get('/api/not-found')
            .end((err, res) => {
                expect(res).to.not.have.cookie('device');
                done();
            });
    });

    it('should not get a distinct cookie device', done => {
        chai.request(app)
            .get('/api/not-found')
            .end((err, res) => {
                expect(res).to.have.cookie('device');
                expect(res).to.not.have.cookie('device', deviceCookie);
                done();
            });
    });    
});
