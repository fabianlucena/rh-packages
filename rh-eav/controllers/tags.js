import { conf } from '../conf.js';
import { getOptionsFromParamsAndOData } from 'http-util';

export class TagsController {
  static async get(req, res) {
    let defaultOptions = {
      view: true,
      limit: 20,
      offset: 0,
      attributes: ['name'],
      //where: {isEnabled: true},
    };

    const definition = { attributeUuid: 'attributeUuid' };
    const options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definition, defaultOptions);
    const result = await conf.eavAttributeTagService.getListAndCount(options);

    res.status(200).send(result);
  }
}