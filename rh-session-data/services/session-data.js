import {conf} from '../conf.js';
import {checkDataForMissingProperties, getSingle} from 'sql-util';
import {merge} from 'rf-util';
import {loc} from 'rf-locale';

export class SessionDataService {
    static async completeJsonData(data) {
        if (!data.jsonData && data.data)
            data.jsonData = JSON.stringify(data.data);

        return data;
    }

    /**
     * Creates a new Site row into DB.
     * @param {{
     *  isEnabled: boolean,
     *  name: string,
     *  title: string,
     * }} data - data for the new Site.
     *  - name must be unique.
     * @returns {Promise[Site]}
     */
    static async create(data) {
        await SessionDataService.completeJsonData(data);
        await checkDataForMissingProperties(data, 'SessionData', 'sessionId', 'jsonData');

        return conf.global.models.SessionData.create(data);
    }

    static async updateForSessionId(data, sessionId) {
        await SessionDataService.completeJsonData(data);
        await checkDataForMissingProperties({sessionId}, 'SessionData', 'sessionId');
        await checkDataForMissingProperties(data, 'SessionData', 'jsonData');

        return conf.global.models.SessionData.update(data, {where: {sessionId}});
    }

    static async updateForSessionIdOrcreate(sessionId, data) {
        const rows = await SessionDataService.getList({where: {...data?.where, sessionId}, limit: 1});
        if (rows?.length)
            return SessionDataService.updateForSessionId(data, sessionId);
        else
            return SessionDataService.create({...data, sessionId});
    }

    /**
     * Gets the options for use in the getList and getListAndCount methods.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {options}
     */
    static async getListOptions(options) {
        if (!options)
            options = {};

        return options;
    }

    /**
     * Gets a list of session data.
     * @param {Options} options - options for the @see sequelize.findAll method.
     * @returns {Promise{ProjectList}}
     */
    static async getList(options) {
        return conf.global.models.SessionData.findAll(await SessionDataService.getListOptions(options));
    }

    static async getForSessionId(sessionId, options) {
        const rows = await SessionDataService.getList({...options, where: {...options?.where, sessionId}, limit: 2});
        return getSingle(rows, {...options, params: ['SessionData', [loc._f('Session ID = %s'), sessionId], 'SessionData']});
    }

    /**
     * Get data for a session.
     * @param {string} sessionId - Session ID to retrive the data.
     * @returns {Promise[Site]}
     */
    static async getDataForSessionId(sessionId, options) {
        return (await SessionDataService.getForSessionId(sessionId, options)).data;
    }

    static async getDataIfExistsForSessionId(sessionId, options) {
        return (await SessionDataService.getForSessionId(sessionId, {...options, skipNoRowsError: true}))?.data;
    }

    /**
     * Add data to a session.
     * @param {string} sessionId - Session ID to wich add the data.
     * @param {object} sessionData - Data to add or replace.
     * @returns {Promise[Site]}
     */
    static addData(sessionId, sessionData) {
        return SessionDataService.updateForSessionIdOrcreate(
            sessionId,
            {
                data: merge(
                    SessionDataService.getDataIfExistsForSessionId(sessionId) ?? {},
                    sessionData
                )
            }
        );
    }
}