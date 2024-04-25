import { CompanyService } from '../services/company.js';
import { conf } from '../conf.js';
import { getOptionsFromParamsAndOData, _HttpError, getUuidFromRequest } from 'http-util';
import { checkParameter } from 'rf-util';

const companyService = CompanyService.singleton();

export class CompanyController {
  static async checkData(req, data) {
    if (conf.filters?.getCurrentCompanyId) {
      if (!data.id) {
        if (data.uuid) {
          data.id = await conf.global.services.Company.singleton().getIdForUuid(data.uuid);
        } else if (data.name) {
          data.id = await conf.global.services.Company.singleton().getIdForName(data.name);
        } else {
          return;
        }
      }

      if (!data.id) {
        throw new _HttpError(req.loc._cf('company', 'The company does not exist or you do not have permission to access it.'), 404);
      }

      const companyId = await conf.filters.getCurrentCompanyId(req) ?? null;
      if (data.id != companyId) {
        throw new _HttpError(req.loc._cf('company', 'The company does not exist or you do not have permission to access it.'), 403);
      }
    }

    return true;
  }

  static async checkUuid(req) {
    const uuid = await getUuidFromRequest(req);
    const company = await companyService.getForUuid(uuid, { skipNoRowsError: true });
    if (!company) {
      throw new _HttpError(req.loc._cf('company', 'The company with UUID %s does not exists.'), 404, uuid);
    }

    await CompanyController.checkData(req, { id: company.id });

    return { uuid };
  }

  static async post(req, res) {
    const loc = req.loc;
    checkParameter(req?.body, { name: loc._cf('company', 'Name'), title: loc._cf('company', 'Title') });
        
    const data = { ...req.body };
    if (!data.owner && !data.ownerId) {
      data.ownerId = req.user.id;
      if (!data.ownerId) {
        throw new _HttpError(req.loc._cf('company', 'The company data does not have a owner.'));
      }
    }

    await companyService.create(data);

    res.status(204).send();
  }

  static async get(req, res) {
    if ('$grid' in req.query) {
      return CompanyController.getGrid(req, res);
    } else if ('$form' in req.query) {
      return CompanyController.getForm(req, res);
    }
            
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = {
      view: true,
      limit: 10,
      offset: 0,
      include: {
        Owner: true,
      },
    };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    if (!req.roles.includes('admin') && conf.filters?.getCurrentCompanyId) {
      options.where ??= {};
      options.where.id = await conf.filters.getCurrentCompanyId(req) ?? null;
    }

    const result = await companyService.getListAndCount(options);

    result.rows = result.rows.map(row => {
      if (row.Collaborators) {
        row.ownerDisplayName = row.Collaborators[0]?.User?.displayName;
      }
                
      return row;
    });

    res.status(200).send(result);
  }

  static async getGrid(req, res) {
    checkParameter(req.query, '$grid');

    const actions = [];
    if (req.permissions.includes('company.create')) actions.push('create');
    if (req.permissions.includes('company.edit'))   actions.push('enableDisable', 'edit');
    if (req.permissions.includes('company.delete')) actions.push('delete');
    actions.push('search', 'paginate');
        
    let loc = req.loc;

    res.status(200).send({
      title: await loc._('Companies'),
      load: {
        service: 'company',
        method: 'get',
      },
      actions: actions,
      columns: [
        {
          name: 'title',
          type: 'text',
          label: await loc._('Title'),
        },
        {
          name: 'name',
          type: 'text',
          label: await loc._('Name'),
        },
        {
          name: 'ownerDisplayName',
          type: 'text',
          label: await loc._('Owner'),
        },
      ]
    });
  }

  static async getForm(req, res) {
    checkParameter(req.query, '$form');

    let loc = req.loc;
    res.status(200).send({
      title: await loc._('Companies'),
      action: 'company',
      fields: [
        {
          name: 'title',
          type: 'text',
          label: await loc._('Title'),
          placeholder: await loc._('Title'),
          required: true,
          onValueChanged: {
            mode: {
              create: true,
              defaultValue: false,
            },
            action: 'setValues',
            override: false,
            map: {
              name: {
                source: 'title',
                sanitize: 'dasherize',
              },
            },
          },
        },
        {
          name: 'name',
          type: 'text',
          label: await loc._('Name'),
          placeholder: await loc._('Name'),
          required: true,
          disabled: {
            create: false,
            defaultValue: true,
          },
        },
        {
          name: 'isEnabled',
          type: 'checkbox',
          label: await loc._('Enabled'),
          placeholder: await loc._('Enabled'),
          value: true,
        },
        {
          name: 'description',
          type: 'textArea',
          label: await loc._('Description'),
          placeholder: await loc._('Description'),
        },
      ],
    });
  }

  static async delete(req, res) {
    const { uuid } = await CompanyController.checkUuid(req);
    const rowsDeleted = await companyService.deleteForUuid(uuid);
    if (!rowsDeleted) {
      throw new _HttpError(req.loc._cf('company', 'Company with UUID %s does not exists.'), 403, uuid);
    }

    res.sendStatus(204);
  }

  static async enablePost(req, res) {
    const { uuid } = await CompanyController.checkUuid(req);
    const rowsUpdated = await companyService.enableForUuid(uuid);
    if (!rowsUpdated) {
      throw new _HttpError(req.loc._cf('company', 'Company with UUID %s does not exists.'), 403, uuid);
    }

    res.sendStatus(204);
  }

  static async disablePost(req, res) {
    const { uuid } = await CompanyController.checkUuid(req);
    const rowsUpdated = await companyService.disableForUuid(uuid);
    if (!rowsUpdated) {
      throw new _HttpError(req.loc._cf('company', 'Company with UUID %s does not exists.'), 403, uuid);
    }

    res.sendStatus(204);
  }

  static async patch(req, res) {
    const { uuid } = await CompanyController.checkUuid(req);

    const data = { ...req.body, uuid: undefined };
    const where = { uuid };

    const rowsUpdated = await companyService.updateFor(data, where);
    if (!rowsUpdated) {
      throw new _HttpError(req.loc._cf('company', 'Company with UUID %s does not exists.'), 403, uuid);
    }

    res.sendStatus(204);
  }
}