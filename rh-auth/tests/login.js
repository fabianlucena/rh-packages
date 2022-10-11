let rt = require('../../rh-test');
let {agent} = require('./index');
const chai = require('chai');
const expect = chai.expect;

let headers = {};

describe('Login', () => {
    rt.checkMethodNotAllowed(agent, '/api/login', 'HEAD', 'PUT', 'DELETE', 'PATCH');

    it('no get parameters error', done => {
        agent
            .get('/api/login')
            .end((err, res) => {
                expect(res).to.have.status(400);
                expect(res).to.be.json;
                expect(res.body).to.have.property('error');
                done();
            });
    });

    rt.checkFormGet(agent, '/api/login', 'username', 'password');

    it('missing parameter error for username and password parameters', done => {
        let credentials = {};
        agent
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
        agent
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
        agent
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
        agent
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

    const credentials = {
        username: 'admin',
        password: '1234'
    };
    rt.checkLogin(agent, '/api/login', credentials, res => headers.Authorization = `Bearer ${res.body.authToken}`);

    it('should returns a distinct valid session authToken', done => {
        let credentials = {
            username: 'admin',
            password: '1234'
        };
        agent
            .post('/api/login')
            .send(credentials)
            .end((err, res) => {
                expect(res).to.have.status(201);
                expect(res).to.be.json;
                expect(res.body).to.have.property('authToken');
                expect(res.body).to.have.property('index');
                expect(headers.Authorization).to.be.not.equals(`Bearer ${res.body.authToken}`);
                done();
            });
    });
});

describe('Logout', () => {
    before(function () {
        if (!headers?.Authorization)
            this.skip();
    });

    rt.checkMethodNotAllowed(agent, '/api/logout', headers, 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH');

    it('logout should return a HTTP error 204', done => {
        agent
            .get('/api/logout')
            .set(headers)
            .end((err, res) => {
                expect(res).to.have.status(204);
                expect(res.text).to.be.empty;
                done();
            });
    });

    it('duplicate logout should return a HTTP error 403', done => {
        agent
            .get('/api/logout')
            .set(headers)
            .end((err, res) => {
                expect(res).to.have.status(403);
                expect(res).to.be.json;
                expect(res.body).to.have.property('error');
                done();
            });
    });

    it('logout without authorization should return a HTTP error 401', done => {
        agent
            .get('/api/logout')
            .end((err, res) => {
                expect(res).to.have.status(401);
                expect(res).to.be.json;
                expect(res.body).to.have.property('error');
                done();
            });
    });
});