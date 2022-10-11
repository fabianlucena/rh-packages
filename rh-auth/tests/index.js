const app = require('../../../backend/app');
const chai = require('chai');

chai.use(require('chai-http'));

const agent = chai.request.agent(app);

module.exports = {
    agent: agent,
    app: app,
};

require('./device');
