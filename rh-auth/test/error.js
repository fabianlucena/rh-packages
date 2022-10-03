// https://www.paradigmadigital.com/dev/testeo-api-rest-mocha-chai-http/

const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app');

chai.use(chaiHttp);
const expect = chai.expect;

describe('Error 404', () => {
    /*beforeEach((done) => {
        Book.remove({}, (err) => { 
           done();           
        });        
    });*/
    
    describe('/GET', () => {
        it('should return an error', (done) => {
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
    });
});

after(async () => {
    app.stop();
});