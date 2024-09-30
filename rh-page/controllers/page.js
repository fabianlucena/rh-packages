import { PageService } from '../services/page.js';
import { getOptionsFromParamsAndOData, HttpError } from 'http-util';

const page = PageService.singleton();

export class PageController {
  static async get(req, res) {
    const definitions = { uuid: 'uuid', name: 'string' };
    const options = await getOptionsFromParamsAndOData(
      {
        ...req.query,
        ...req.params,
      },
      definitions,
      {
        view: true,
        limit: 10,
        offset: 0,
        include: { format: true },
      },
    );

    const result = await page.getListAndCount(options);
    if (!result?.count) {
      throw new HttpError(loc => loc._c('page', 'Page not found.'), 404);
    }

    result.rows = result.rows.map(row => {
      if (row.format?.name) {
        row.format = row.format?.name;
      }

      return row;
    });
        
    res.status(200).send(result);
  }
}