import { ResourceService } from '../services/resource.js';
import { getOptionsFromParamsAndOData, _HttpError } from 'http-util';

const resource = ResourceService.singleton();

export class ResourceController {
  static async get(req, res) {
    const definitions = { uuid: 'uuid', name: 'string' };
    const options = await getOptionsFromParamsAndOData(
      { ...req.query, ...req.params },
      definitions,
      {
        view: true,
        limit: 10,
        offset: 0,
        include: { company: true },
      },
    );

    const result = await resource.getListAndCount(options);
    if (!result?.count) {
      throw new _HttpError(req.loc._cf('resource', 'Resource not found.'), 404);
    }

    if (result.count > 1) {
      throw new _HttpError(req.loc._cf('resource', 'There are many resources for that criteria.'), 400);
    }

    const row = result.rows[0];
    const headers = {};
    const data = row.content;

    if (row.Type?.name) {
      row.type = row.Type?.name;    
      headers['Content-Type'] = row.type;
    }

    headers['Content-Length'] = data.length;

    res.writeHead(200, headers);
    res.end(data);
  }
}