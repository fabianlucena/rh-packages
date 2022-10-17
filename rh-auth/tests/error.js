const rt = require('rh-test');
const chai = require('chai');
const expect = chai.expect;

describe('HTTP Errors', () => {
    it('HTTP 403 error for empty URL', (done) => {
        let credentials = {};
        rt.getAgent()
            .get('')
            .send(credentials)
            .end((err, res) => {
                expect(res).to.have.status(403);
                expect(res).to.be.json;
                expect(res.body).to.have.property('error');
                done();
            });
    });
    
    it('HTTP 401 error for URL "/api/not-found"', (done) => {
        let credentials = {};
        rt.getAgent()
            .get('/api/not-found')
            .send(credentials)
            .end((err, res) => {
                expect(res).to.have.status(401);
                expect(res).to.be.json;
                expect(res.body).to.have.property('error');
                done();
            });
    });
});
