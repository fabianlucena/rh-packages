import { PageService } from '../services/page.js';
import { getOptionsFromParamsAndOData, _HttpError } from 'http-util';
import { defaultLoc } from 'rf-locale';

const page = PageService.singleton();

export class PageController {
  static async get(req, res) {
    const loc = req.loc ?? defaultLoc;
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
        include: { company: true },
      },
    );

    const result = await page.getListAndCount(options);
    if (!result?.count) {
      throw new _HttpError(loc._cf('page', 'Page not found.'), 404);
    }

    result.rows = result.rows.map(row => {
      if (row.Format?.name) {
        row.format = row.Format?.name;
      }

      return row;
    });
        
    res.status(200).send(result);
  }
}