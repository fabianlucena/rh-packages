// https://www.paradigmadigital.com/dev/testeo-api-rest-mocha-chai-http/

const app = require('../../../backend/app');
const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;

chai.use(chaiHttp);

describe('HTTP Errors', () => {
    /*beforeEach((done) => {
        Book.remove({}, (err) => { 
           done();           
        });        
    });*/
    
    it('HTTP 403 error for empty URL', (done) => {
        let credentials = {};
        chai.request(app)
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
        chai.request(app)
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
