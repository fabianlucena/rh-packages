import { Controller } from 'rh-controller';
import dependency from 'rf-dependency';
import { checkParameterStringNotNullOrEmpty } from 'rf-util';
import { _NotFoundError } from 'http-util';

export class IconController extends Controller {
  constructor() {
    super();
    this.iconService = dependency.get('iconService');
  }
  
  async 'get /:name'(req, res) {
    const name = checkParameterStringNotNullOrEmpty(req.params?.name);
    const data = await this.iconService.getForNameOrNull(name);
    if (!data) {
      throw new _NotFoundError(req.loc._f('Icon "%s" not found', name));
    }

    res.write(data);
  }
}