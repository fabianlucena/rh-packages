import { rt } from 'rh-test';
import chai from 'chai';

const expect = chai.expect;

describe('HTTP Errors', () => {
  before(function () {
    if (!rt.hasModule('rhAuth'))
      this.skip();
  });

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
    
  it('HTTP 404 error for URL "/api/not-found"', (done) => {
    let credentials = {};
    rt.getAgent()
      .get('/api/not-found')
      .send(credentials)
      .end((err, res) => {
        expect(res).to.have.status(404);
        expect(res).to.be.json;
        expect(res.body).to.have.property('error');
        done();
      });
  });
});
