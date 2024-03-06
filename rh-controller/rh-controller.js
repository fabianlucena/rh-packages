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
        if ('$grid' in req.query) {
            let instance;
            if (this.prototype.getGrid) {
                instance = new this;
            } else if (this.getGrid) {
                instance = this;
            }

            if (instance) {
                const result = await instance.getGrid(req, res, next);
                res.status(200).json(result);
                return;
            }
        }
        
        if ('$form' in req.query) {
            let instance;
            if (this.prototype.getForm) {
                instance = new this;
            } else if (this.getForm) {
                instance = this;
            }

            if (instance) {
                const result = await instance.getForm(req, res, next);
                res.status(200).json(result);
                return;
            }
        }

        let instance;
        if (this.prototype.getData) {
            instance = new this;
        } else if (this.getData) {
            instance = this;
        }

        if (instance) {
            const result = await instance.getData(req, res, next);
            res.status(200).json(result);
            return;    
        }

        res.status(405).send({error: 'HTTP method not allowed.'});
    }
}
