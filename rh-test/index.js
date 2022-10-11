const chai = require('chai');
const expect = chai.expect;

module.exports = {
    checkMethodNotAllowed(agent, url, headersOrMethod, ...methods) {
        let headers;
        if (typeof headersOrMethod !== 'object' && headersOrMethod) {
            methods = [headersOrMethod, ...methods];
            headers = {};
        } else {
            headers = headersOrMethod;
        }

        for (const i in methods) {
            const method = methods[i].toLowerCase();
    
            it(`${method.toUpperCase()} HTTP method not allowed`, done => {
                agent[method](url)
                    .set(headers)
                    .end((_, res) => {
                        expect(res).to.have.status(405);
                        if (method === 'head') {
                            expect(res.text).to.be.empty;
                        } else {
                            expect(res).to.be.json;
                            expect(res.body).to.have.property('error');
                        }
    
                        done();
                    });
            });
        }
    },

    checkFormGet(agent, url, headersOrProperty, ...properties) {
        let headers;
        if (typeof headersOrProperty !== 'object') {
            if (headersOrProperty)
                properties = [headersOrProperty, ...properties];
            headers = {};
        } else {
            headers = headersOrProperty;
        }

        const title = (properties && properties.length)?
            `$form get parameter should return a form structure with the properties: ${properties.join(', ')}`:
            '$form get parameter should return a form structure with properties';

        it(title, done => {
            agent
                .get(`${url}?$form`)
                .set(headers)
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    for (const i in properties)
                        expect(res.body).to.have.property(properties[i]);

                    done();
                });
        });
    },

    checkLogin(agent, url, credentials, method) {
        it('should returns a valid session authToken', done => {
            agent
                .post(url)
                .send(credentials)
                .end((err, res) => {
                    expect(res).to.have.status(201);
                    expect(res).to.be.json;
                    expect(res.body).to.have.property('authToken');
                    expect(res.body).to.have.property('index');

                    method(res);
                    
                    done();
                });
        });
    },
};