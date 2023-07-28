'use strict';

import {LogService} from '../services/log.js';
import {getOptionsFromParamsAndOData} from 'http-util';
import {checkParameter} from 'rf-util';

const logService = LogService.singleton();

export class LogController {
    static async get(req, res) {
        if ('$grid' in req.query)
            return LogController.getGrid(req, res);

        let options = {
            view: true,
            limit: 10,
            offset: 0,
            order: [['dateTime', 'DESC']],
            loc: req.loc,
        };

        options = await getOptionsFromParamsAndOData(req?.query, null, options);
        const result = logService.getListAndCount(options);

        res.status(200).send(result);
    }

    static async getGrid(req, res) {
        checkParameter(req.query, '$grid');

        const actions = [/*'view', */'search', 'paginate'];
                
        let loc = req.loc;

        res.status(200).send({
            title: await loc._c('log', 'Log'),
            load: {
                service: 'log',
                method: 'get',
            },
            actions: actions,
            columns: [
                {
                    name: 'dateTime',
                    type: 'dateTime',
                    label: await loc._c('log', 'Date time'),
                },
                {
                    name: 'type',
                    type: 'text',
                    label: await loc._c('log', 'Type'),
                },
                {
                    name: 'session',
                    type: 'text',
                    label: await loc._c('log', 'Session'),
                },
                {
                    name: 'message',
                    type: 'text',
                    label: await loc._c('log', 'Message'),
                },
            ],
            details: [
                {
                    name: 'data',
                    type: 'object',
                    label: await loc._c('log', 'Data'),
                },
            ]
        });
    }
}