import { Controller } from 'rh-controller';
import dependency from 'rf-dependency';
import { defaultLoc } from 'rf-locale';

export class OAuth2ClientController extends Controller {
  path = '/oauth2-client';

  constructor() {
    super();
    this.service = dependency.get('oAuth2ClientService');
  }

  static routes() {
    const routes = super.routes();
    return routes;
  }

  getPermission =            'oauth2Client.get';
  postPermission =           'oauth2Client.create';
  patchPermission =          'oauth2Client.edit';
  deletePermission =         'oauth2Client.delete';
  enableForUuidPermission =  'oauth2Client.edit';
  disableForUuidPermission = 'oauth2Client.edit';

  'getData';

  async getFields(req) {
    const loc = req.loc ?? defaultLoc;

    const gridActions = [];
    if (req.permissions.includes('oauth2Client.create')) gridActions.push('create');
    if (req.permissions.includes('oauth2Client.edit'))   gridActions.push('enableDisable', 'edit');
    if (req.permissions.includes('oauth2Client.delete')) gridActions.push('delete');
    gridActions.push('search', 'paginate');

    const fields = [
      {
        name: 'title',
        type: 'text',
        isField: true,
        isColumn: true,
        label: await loc._c('oauth2Client', 'Title'),
        placeholder: await loc._c('oauth2Client', 'Title'),
        value: true,
      },
      {
        name: 'name',
        type: 'text',
        isField: true,
        isColumn: true,
        label: await loc._c('oauth2Client', 'Name'),
        placeholder: await loc._c('oauth2Client', 'Name'),
        autocomplete: 'off',
        spellcheck: false,
        disabled: {
          create: false,
          defaultValue: true,
        },
      },
      {
        name: 'isEnabled',
        type: 'checkbox',
        isField: true,
        label: await loc._c('oauth2Client', 'Enabled'),
        placeholder: await loc._c('oauth2Client', 'Enabled'),
        value: true,
      },
      {
        name: 'projectId',
        type: 'textArea',
        isField: true,
        isDetail: true,
        label: await loc._c('oauth2Client', 'Project ID'),
        placeholder: await loc._c('oauth2Client', 'Project ID'),
        autocomplete: 'off',
        spellcheck: false,
      },
      {
        name: 'clientId',
        type: 'textArea',
        isField: true,
        isDetail: true,
        label: await loc._c('oauth2Client', 'Client ID'),
        placeholder: await loc._c('oauth2Client', 'Client ID'),
        autocomplete: 'off',
        spellcheck: false,
      },
      {
        name: 'clientSecret',
        type: 'textArea',
        isField: true,
        isDetail: true,
        label: await loc._c('oauth2Client', 'Client secret'),
        placeholder: await loc._c('oauth2Client', 'Client secret'),
        autocomplete: 'off',
        spellcheck: false,
      },
      {
        name: 'requestUrl',
        type: 'textArea',
        isField: true,
        isDetail: true,
        label: await loc._c('oauth2Client', 'Request URL'),
        detail: await loc._c('oauth2Client', 'Use enter and whites spaces for formatting, they will be removed to send the request.'),
        placeholder: await loc._c('oauth2Client', 'Request URL'),
        className: 'pre',
        autocomplete: 'off',
        spellcheck: false,
      },
    ];

    const result = {
      title: await loc._c('oauth2Client', 'OAuth2 client'),
      gridActions,
      fields
    };

    return result;
  }
}