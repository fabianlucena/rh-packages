import {getRoutes} from 'rf-get-routes';

/**
 * This is the base class for HTTP controller definitions.
 * The controller takes the functions methods static and non static and map to
 * routes. For more information please referer to rf-get-routes library.
 */
export class RHController {
    static routes() {
        return getRoutes(
            this,
            {
                appendHandlers: [
                    {name: 'getData', httpMethod: 'get', handler: 'defaultGet'},
                    {name: 'getGrid', httpMethod: 'get', handler: 'defaultGet'}, 
                    {name: 'getForm', httpMethod: 'get', handler: 'defaultGet'},
                ],
            },
        );
    }

    static all(req, res) {
        res.status(405).send({error: 'HTTP method not allowed.'});
    }

    static async defaultGet(req, res, next) {
        if ('$grid' in req.query && this.getGrid) {
            const result = await this.getGrid(req, res, next);
            res.status(200).json(result);
            return;
        }
        
        if ('$form' in req.query && this.getForm) {
            res.status(200).json(await this.getForm(req, res, next));
            return;
        }

        if (this.getData) {
            res.status(200).json(await this.getData(req, res, next));
            return;    
        }

        
        res.status(405).send({error: 'HTTP method not allowed.'});
    }
}
