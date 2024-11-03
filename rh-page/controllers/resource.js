import { Controller } from 'rh-controller';
import { getOptionsFromParamsAndOData, HttpError } from 'http-util';
import { checkParameter } from 'rf-util';
import fs from 'fs/promises';
import fileUpload from 'express-fileupload';
import dependency from 'rf-dependency';
import { conf } from '../conf.js';
import { defaultLoc } from 'rf-locale';

const upload = fileUpload({ createParentPath: true });

export class ResourceController extends Controller {
  constructor() {
    super();
    this.service = dependency.get('resourceService');
  }

  getPermission = 'resource.get';
  async getData(req) {
    const definitions = { uuid: 'uuid', name: 'string' };
    const options = await getOptionsFromParamsAndOData(
      { ...req.query, ...req.params },
      definitions,
      {
        view: true,
        limit: 10,
        offset: 0,
        include: { type: true },
      },
    );
    let result = await this.service.getListAndCount(options);
    result = await this.service.sanitize(result);

    return result;
  }

  async 'get /:name'(req, res) {
    const definitions = { uuid: 'uuid', name: 'string' };
    const options = await getOptionsFromParamsAndOData(
      { ...req.query, ...req.params },
      definitions,
      {
        attributes: ['content'],
        view: true,
        limit: 10,
        offset: 0,
        include: { type: true },
      },
    );

    const result = await this.service.getListAndCount(options);
    if (!result?.count) {
      throw new HttpError(loc => loc._c('resource', 'Resource not found.'), 404);
    }

    if (result.count > 1) {
      throw new HttpError(loc => loc._c('resource', 'There are many resources for that criteria.'), 400);
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

  async getInterface(req) {
    const loc = req.loc ?? defaultLoc;
    const gridActions = [];

    if (req.permissions.includes('resource.create')) {
      gridActions.push('create');
    }

    gridActions.push('search', 'paginate');
    return {
      title: await loc._c('resource', 'Resource'),
      action: 'resource',
      method: 'POST',
      progress: true,
      gridActions,
      fields: [
        {
          name:        'name',
          type:        'text',
          label:       await loc._c('resource', 'Name'),
          isField:     false,
          isColumn:    true,
        },
        {
          name:        'title',
          type:        'text',
          label:       await loc._c('resource', 'Title'),
          placeholder: await loc._c('resource', 'Type the title here'),
          isField:     true,
          isColumn:    true,
          required:    true,
        },
        {
          name: 'file',
          type: 'file',
          isField: true,
          isColumn: false,
          label: await loc._c('resource', 'File'),
        },
      ],
    };
  }

  postPermission = 'resource.create';
  postMiddleware = upload;
  async post(req) {
    checkParameter(
      req?.body,
      {
        title:  loc => loc._c('resource', 'Title'),
        file:   loc => loc._c('resource', 'File'),
      },
    );

    const log = req.log;
    const uploadedFile = req.files?.file;

    await this.service.checkNameForConflict(uploadedFile.name);

    const filename = conf.global.config.server.resourcesUploadsPath + uploadedFile.name;
    log.info(`Archivo recibido: ${uploadedFile.name}, MD5: ${uploadedFile.md5}.`);

    await uploadedFile.mv(filename);
    log.info(`Archivo movido: ${uploadedFile.name} -> ${filename}.`);
    try {
      const resource = {
        name: uploadedFile.name,
        language: 'en',
        type: uploadedFile.mimetype,
        title: req.body.title,
        content: Buffer.from(await fs.readFile(filename, 'binary'), 'binary'),
      };
  
      await this.service.create(resource); 
    } catch(ex) {
      await fs.unlink(filename);
      throw ex;
    }
  }
}