import {SessionService} from './session.js';

export class LogoutService {
    /**
     * Close the given session and it is no longr valid.
     * @param {{id: number}} session 
     * @returns 
     */
    static logout(session) {
        return SessionService.closeForId(session.id);
    }
}
