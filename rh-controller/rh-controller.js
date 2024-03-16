import { getRoutes } from 'rf-get-routes';

/**
 * This is the base class for HTTP controller definitions.
 * The controller takes the functions methods static and non static and map to
 * routes. For more information please referer to rf-get-routes library.
 */
export class Controller {
    static routes() {
        const routes = getRoutes(
            this,
            {
                appendHandlers: [
                    {name: 'getData', httpMethod: 'get', handler: 'defaultGet'},
                    {name: 'getGrid', httpMethod: 'get', handler: 'defaultGet'}, 
                    {name: 'getForm', httpMethod: 'get', handler: 'defaultGet'},
                ],
            },
        );

        return routes;
    }

    all(req, res) {
        res.status(405).send({error: 'HTTP method not allowed.'});
    }

    async defaultGet(req, res, next) {
        if ('$grid' in req.query) {
            let instance;
            if (this.getGrid) {
                instance = this;
            } else if (this.constructor.getGrid) {
                instance = this.constructor;
            }

            if (instance) {
                const result = await instance.getGrid(req, res, next);
                res.status(200).json(result);
                return;
            }
        }
        
        if ('$form' in req.query) {
            let instance;
            if (this.getForm) {
                instance = this;
            } else if (this.constructor.getForm) {
                instance = this.constructor;
            }

            if (instance) {
                const result = await instance.getForm(req, res, next);
                res.status(200).json(result);
                return;
            }
        }

        let instance;
        if (this.getData) {
            instance = this;
        } else if (this.constructor.getData) {
            instance = this.constructor;
        }

        if (instance) {
            const result = await instance.getData(req, res, next);
            res.status(200).json(result);
            return;    
        }

        res.status(405).send({error: 'HTTP method not allowed.'});
    }
}
