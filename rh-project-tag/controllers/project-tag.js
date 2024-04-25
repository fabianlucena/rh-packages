import { conf } from '../conf.js';
import { getOptionsFromParamsAndOData } from 'http-util';

const tagService = conf.global.services.Tag.singleton();

export class projectTagController {
  static async getTags(req, res) {
    const defaultOptions = {
      view: true,
      limit: 20,
      offset: 0,
      attributes: ['name'],
      where: { isEnabled: true },
    };
    const options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, null, defaultOptions);
    options.where.tagCategory = conf.tagCategory;

    const result = await tagService.getListAndCount(options);

    res.status(200).send(result);
  }
}