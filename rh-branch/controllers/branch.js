import { conf } from '../conf.js';
import { getOptionsFromParamsAndOData, _HttpError, _ConflictError } from 'http-util';
import { checkParameter, checkParameterUuid, filterVisualItemsByAliasName } from 'rf-util';
import Controller from 'rh-controller';
import dependency from 'rf-dependency';

export class BranchController extends Controller {
  constructor() {
    super();

    this.service =        dependency.get('branchService');
    this.companyService = dependency.get('companyService');
  }

  async checkDataForCompanyId(req, data) {
    if (!conf.filters?.getCurrentCompanyId) {
      return;
    }
            
    if (!data.companyId) {
      if (data.companyUuid) {
        data.companyId = await this.companyService.getIdForUuid(data.companyUuid);
      } else if (data.companyName) {
        data.companyId = await this.companyService.getIdForName(data.companyName);
      } else {
        data.companyId = await conf.filters.getCurrentCompanyId(req) ?? null;
        return data.companyId;
      }
        
      if (!data.companyId) {
        throw new _HttpError(req.loc._cf('branch', 'The company does not exist or you do not have permission to access it.'), 404);
      }
    }

    const companyId = await conf.filters.getCurrentCompanyId(req) ?? null;
    if (data.companyId != companyId) {
      throw new _HttpError(req.loc._cf('branch', 'The company does not exist or you do not have permission to access it.'), 403);
    }

    return data.companyId;
  }

  async checkUuid(req, uuid) {
    const branch = await this.branchService.getForUuid(uuid, { skipNoRowsError: true });
    if (!branch) {
      throw new _HttpError(req.loc._cf('branch', 'The branch with UUID %s does not exists.'), 404, uuid);
    }

    return await this.checkDataForCompanyId(req, { companyId: branch.companyId });
  }

  postPermission = 'branch.create';
  async post(req, res) {
    const loc = req.loc;
    checkParameter(req?.body, { name: loc._cf('branch', 'Name'), title: loc._cf('branch', 'Title') });
        
    const data = { ...req.body };

    await this.checkDataForCompanyId(req, data);

    if (await branchService.getForName(data.name, { skipNoRowsError: true })) {
      throw new _ConflictError(req.loc._cf('branch', 'Exists another branch with that name.'));
    }

    if (!data.owner && !data.ownerId) {
      data.ownerId = req.user.id;
      if (!data.ownerId) {
        throw new _HttpError(req.loc._cf('branch', 'The branch data does not have a owner.'));
      }
    }

    await branchService.create(data);
    res.status(204).send();
  }

  getPermission = 'branch.get';
  async getData(req, res) {
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = {
      view: true,
      limit: 10,
      offset: 0,
      include: {
        company: true,
      },
    };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    if (conf.filters?.getCurrentCompanyId) {
      options.where ??= {};
      options.where.companyId = await conf.filters.getCurrentCompanyId(req) ?? null;
    }

    await conf.global.eventBus?.$emit('Branch.response.getting', options);

    const result = await branchService.getListAndCount(options);

    result.rows = result.rows.map(row => {
      row.companyUuid = row.company.uuid;
      return row;
    });

    await conf.global.eventBus?.$emit('Branch.response.getted', result, options);

    res.status(200).send(result);
  }

  async getGrid(req, res) {
    checkParameter(req.query, '$grid');

    const actions = [];
    if (req.permissions.includes('branch.create')) actions.push('create');
    if (req.permissions.includes('branch.edit'))   actions.push('enableDisable', 'edit');
    if (req.permissions.includes('branch.delete')) actions.push('delete');
    actions.push('search', 'paginate');
        
    const loc = req.loc;
    const columns = [
      {
        name: 'title',
        type: 'text',
        label: await loc._cf('branch', 'Title'),
      },
      {
        name: 'name',
        type: 'text',
        label: await loc._cf('branch', 'Name'),
      },
      {
        alias: 'company',
        name: 'company.title',
        type: 'text',
        label: await loc._cf('branch', 'Company'),
      },
      {
        alias: 'owner',
        name: 'owner.user.displayName',
        type: 'text',
        label: await loc._cf('branch', 'Owner'),
      },
    ];

    const grid = {
      title: await loc._('Branches'),
      load: {
        service: 'branch',
        method: 'get',
      },
      actions,
      columns: await filterVisualItemsByAliasName(columns, conf?.branch, { loc, entity: 'Branch', translationContext: 'branch', interface: 'grid' }),
    };

    await conf.global.eventBus?.$emit('Branch.interface.grid.get', grid, { loc });

    res.status(200).send(grid);
  }

  async getForm(req, res) {
    checkParameter(req.query, '$form');

    const loc = req.loc;
    const fields = [
      {
        name: 'title',
        type: 'text',
        label: await loc._cf('branch', 'Title'),
        placeholder: await loc._cf('branch', 'Title'),
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
        label: await loc._cf('branch', 'Name'),
        placeholder: await loc._cf('branch', 'Name'),
        required: true,
        disabled: {
          create: false,
          defaultValue: true,
        },
      },
      {
        alias: 'company',
        name: 'companyUuid',
        type: 'select',
        label: await loc._cf('branch', 'Company'),
        placeholder: await loc._cf('branch', 'Company'),
        required: true,
        loadOptionsFrom: {
          service: 'branch/company',
          value: 'uuid',
          text: 'title',
          title: 'description',
        },
      },
      {
        name: 'isEnabled',
        type: 'checkbox',
        label: await loc._cf('branch', 'Enabled'),
        placeholder: await loc._cf('branch', 'Enabled'),
        value: true,
      },
      {
        name: 'description',
        type: 'textArea',
        label: await loc._cf('branch', 'Description'),
        placeholder: await loc._cf('branch', 'Description'),
      },
    ];

    const form = {
      title: await loc._('Branches'),
      action: 'branch',
      fields: await filterVisualItemsByAliasName(fields, conf?.branch, { loc, entity: 'Branch', translationContext: 'branch', interface: 'form' }),
    };

    await conf.global.eventBus?.$emit('interface.form.get', form, { loc, entity: 'Branch' });
    await conf.global.eventBus?.$emit('Branch.interface.form.get', form, { loc });

    res.status(200).send(form);
  }

  deletePermission = 'branch.delete';
  async delete(req, res) {
    const uuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, req.loc._cf('branch', 'UUID'));
    await this.checkUuid(req, uuid);

    const rowsDeleted = await branchService.deleteForUuid(uuid);
    if (!rowsDeleted) {
      throw new _HttpError(req.loc._cf('branch', 'Branch with UUID %s does not exists.'), 403, uuid);
    }

    res.sendStatus(204);
  }

  enablePostPermission = 'branch.edit';
  async enablePost(req, res) {
    const uuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, req.loc._cf('branch', 'UUID'));
    await this.checkUuid(req, uuid);

    const rowsUpdated = await branchService.enableForUuid(uuid);
    if (!rowsUpdated) {
      throw new _HttpError(req.loc._cf('branch', 'Branch with UUID %s does not exists.'), 403, uuid);
    }

    res.sendStatus(204);
  }

  disablePostPermission = 'branch.edit';
  async disablePost(req, res) {
    const uuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, req.loc._cf('branch', 'UUID'));
    await this.checkUuid(req, uuid);

    const rowsUpdated = await branchService.disableForUuid(uuid);
    if (!rowsUpdated) {
      throw new _HttpError(req.loc._cf('branch', 'Branch with UUID %s does not exists.'), 403, uuid);
    }

    res.sendStatus(204);
  }

  patchPermission = 'branch.edit';
  async patch(req, res) {
    const uuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, req.loc._cf('branch', 'UUID'));
    await this.checkUuid(req, uuid);

    const rowsUpdated = await branchService.updateForUuid(req.body, uuid);
    if (!rowsUpdated) {
      throw new _HttpError(req.loc._cf('branch', 'Branch with UUID %s does not exists.'), 403, uuid);
    }

    res.sendStatus(204);
  }

  'getPermission /company' = 'branch.edit';
  async getCompany(req, res) {
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = { view: true, limit: 10, offset: 0 };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    if (conf.filters?.getCurrentCompanyId) {
      options.where ??= {};
      options.where.id = await conf.filters.getCurrentCompanyId(req) ?? null;
    }

    const result = await conf.global.services.Company.singleton().getListAndCount(options);

    const loc = req.loc;
    result.rows = result.rows.map(row => {
      if (row.isTranslatable) {
        row.title = loc._(row.title);
        row.description = loc._(row.description);
        delete row.isTranslatable;
      }

      return row;
    });

    res.status(200).send(result);
  }
}