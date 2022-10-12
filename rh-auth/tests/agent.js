const app = require('./app');
const chai = require('chai');

chai.use(require('chai-http'));

module.exports = chai.request.agent(app);

require('./device');
