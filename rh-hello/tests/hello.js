import { rt } from 'rh-test';
import chai from 'chai';

const expect = chai.expect;

describe('Hello', () => {
  before(function () {
    if (!rt.includesModule('rhHello')) {
      this.skip();
    }
  });

  it('Must return Hello World!', (done) => {
    let credentials = {};
    rt.getAgent()
      .get(rt.base + '/hello')
      .send(credentials)
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });
});
