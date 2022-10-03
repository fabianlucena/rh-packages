const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app');

chai.use(chaiHttp);
const expect = chai.expect;

describe('Login', () => {
    describe('/GET login', () => {
        it('should return an error', (done) => {
            let credentials = {};
            chai.request(app)
                .get('/api/login')
                .send(credentials)
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    expect(res).to.be.json;
                    expect(res.body).to.have.property('error');
                    done();
                });
        });
    });

    describe('/POST login', () => {
        it('should return a "No username" login error', (done) => {
            let credentials = {};
            chai.request(app)
                .post('/api/login')
                .send(credentials)
                .end((err, res) => {
                    expect(res).to.have.status(400);
                    expect(res).to.be.json;
                    expect(res.body).to.have.property('error').to.be.equal('No username');
                    done();
                });
        });

        it('should return a "No password" login error', (done) => {
            let credentials = {username: 'admin'};
            chai.request(app)
                .post('/api/login')
                .send(credentials)
                .end((err, res) => {
                    expect(res).to.have.status(400);
                    expect(res).to.be.json;
                    expect(res.body).to.have.property('error').to.be.equal('No password');
                    done();
                });
        });

        it('should return a "Invalid credentials" login error', (done) => {
            let credentials = {
                username: 'admin',
                password: '12345'
            };
            chai.request(app)
                .post('/api/login')
                .send(credentials)
                .end((err, res) => {
                    expect(res).to.have.status(403);
                    expect(res).to.be.json;
                    expect(res.body).to.have.property('error').to.be.equal('Invalid credentials');
                    done();
                });
        });

        it('should return a valid session authToken', (done) => {
            let credentials = {
                username: 'admin',
                password: '1234'
            };
            chai.request(app)
                .post('/api/login')
                .send(credentials)
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.have.property('authToken');
                    expect(res.body).to.have.property('index');
                    expect(res).to.have.cookie('device');
                    done();
                });
        });
    });
});