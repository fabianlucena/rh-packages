const app = require('../../../backend/app');
const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;

chai.use(chaiHttp);

describe('Login', () => {
    it('no get parameters error', done => {
        chai.request(app)
            .get('/api/login')
            .end((err, res) => {
                expect(res).to.have.status(400);
                expect(res).to.be.json;
                expect(res.body).to.have.property('error');
                done();
            });
    });

    it('$form get parameter should return a form structure with username and password properties', done => {
        chai.request(app)
            .get('/api/login?$form')
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.have.property('username');
                expect(res.body).to.have.property('password');
                done();
            });
    });

    it('missing parameter error for username and password parameters', done => {
        let credentials = {};
        chai.request(app)
            .post('/api/login')
            .send(credentials)
            .end((err, res) => {
                expect(res).to.have.status(400);
                expect(res).to.be.json;
                expect(res.body).to.have.property('error');
                expect(res.body).to.have.property('missingParameters').contains('username').contains('password');
                done();
            });
    });

    it('missing parameter error for username parameter', done => {
        let credentials = {password: '1234'};
        chai.request(app)
            .post('/api/login')
            .send(credentials)
            .end((err, res) => {
                expect(res).to.have.status(400);
                expect(res).to.be.json;
                expect(res.body).to.have.property('error');
                expect(res.body).to.have.property('missingParameters').contains('username');
                done();
            });
    });

    it('missing parameter error for password parameter', done => {
        let credentials = {username: 'admin'};
        chai.request(app)
            .post('/api/login')
            .send(credentials)
            .end((err, res) => {
                expect(res).to.have.status(400);
                expect(res).to.be.json;
                expect(res.body).to.have.property('error');
                expect(res.body).to.have.property('missingParameters').contains('password');
                done();
            });
    });

    it('"Invalid credentials" login error', done => {
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
                expect(res.body).to.have.property('error');
                expect(res.body).to.have.property('message').contains('Invalid credentials');
                done();
            });
    });

    it('should returns a valid session authToken', done => {
        let credentials = {
            username: 'admin',
            password: '1234'
        };
        chai.request(app)
            .post('/api/login')
            .send(credentials)
            .end((err, res) => {
                expect(res).to.have.status(201);
                expect(res).to.be.json;
                expect(res.body).to.have.property('authToken');
                expect(res.body).to.have.property('index');
                expect(res).to.have.cookie('device');
                done();
            });
    });

    it('HTTP method not allowed error for PUT', done => {
        chai.request(app)
            .put('/api/login')
            .end((err, res) => {
                expect(res).to.have.status(405);
                expect(res).to.be.json;
                expect(res.body).to.have.property('error');
                done();
            });
    });

    it('HTTP method not allowed error for DELETE', done => {
        chai.request(app)
            .delete('/api/login')
            .end((err, res) => {
                expect(res).to.have.status(405);
                expect(res).to.be.json;
                expect(res.body).to.have.property('error');
                done();
            });
    });

    it('HTTP method not allowed error for PATCH', done => {
        chai.request(app)
            .patch('/api/login')
            .end((err, res) => {
                expect(res).to.have.status(405);
                expect(res).to.be.json;
                expect(res.body).to.have.property('error');
                done();
            });
    });
});