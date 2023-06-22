'use strict';

import {SessionService} from './session.js';

export class LogoutService {
    static singleton() {
        if (!this.singletonInstance)
            this.singletonInstance = new this();

        return this.singletonInstance;
    }

    /**
     * Close the given session and it is no longr valid.
     * @param {{id: number}} session 
     * @returns {Promise[integer]}
     */
    async logout(session) {
        return SessionService.singleton().closeForId(session.id);
    }
}
