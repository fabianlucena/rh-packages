import { SiteService } from '../services/site.js';
import { getOptionsFromParamsAndOData } from 'http-util';

export class SiteController {
  static async get(req, res) {
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = { view: true, limit: 10, offset: 0 };

    options = await getOptionsFromParamsAndOData(req?.query, definitions, options);
    const rows = await SiteService.singleton().getList(options);

    res.status(200).send(rows);
  }
}