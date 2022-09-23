const Session = require('../services/session');

const LogoutService = {
    /**
     * Close the given session and it is no longr valid.
     * @param {{id: number}} session 
     * @returns 
     */
    logout: session => Session.closeForId(session.id),
};

module.exports = LogoutService;
