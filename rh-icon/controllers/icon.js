import { Controller } from 'rh-controller';
import dependency from 'rf-dependency';
import { checkParameterStringNotNullOrEmpty } from 'rf-util';
import { StatusCodes } from 'http-status-codes';
import mime from 'mime-types';
import fs from 'fs';

export class IconController extends Controller {
  constructor() {
    super();
    this.iconService = dependency.get('iconService');
  }
  
  async 'get /:name'(req, res) {
    const name = checkParameterStringNotNullOrEmpty(req.params?.name);
    const path = await this.iconService.getPathForNameOrNull(name);
    if (!path) {
      res.status(StatusCodes.NOT_FOUND).end();
      return;
    }

    const data = Buffer.from(fs.readFileSync(path, 'binary'), 'binary');

    res
      .status(StatusCodes.OK)
      .setHeader('Content-Type', mime.lookup(path))
      .send(data)
      .end();
  }
}