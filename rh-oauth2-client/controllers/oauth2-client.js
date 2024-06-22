import { Controller } from 'rh-controller';
import dependency from 'rf-dependency';
import { defaultLoc } from 'rf-locale';

export class OAuth2ClientController extends Controller {
  path = '/oauth2-client';

  constructor() {
    super();
    this.service = dependency.get('oAuth2ClientService');
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
        placeholder: await loc._c('oauth2Client', 'Put here the OAuth2 client name'),
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
        name: 'clientId',
        type: 'textArea',
        isField: true,
        isDetail: true,
        label: await loc._c('oauth2Client', 'Client ID'),
        placeholder: await loc._c('oauth2Client', 'Put here the client ID'),
        autocomplete: 'off',
        spellcheck: false,
      },
      {
        name: 'clientSecret',
        type: 'textArea',
        isField: true,
        isDetail: true,
        label: await loc._c('oauth2Client', 'Client secret'),
        placeholder: await loc._c('oauth2Client', 'Put here the client secret'),
        autocomplete: 'off',
        spellcheck: false,
      },
      {
        name: 'requestURL',
        type: 'textArea',
        isField: true,
        isDetail: true,
        label: await loc._c('oauth2Client', 'Request URL'),
        detail: await loc._c('oauth2Client', 'Use enter and whites spaces for formatting, they will be removed to send the request.'),
        placeholder: 'https://accounts.google.com/o/oauth2/v2/auth?\n  scope=profile%20email&\n  access_type=offline&\n  include_granted_scopes=true&\n  response_type=code&\n  client_id=<<< your client ID >>>&\n  redirect_uri=http://localhost:8081/redirection/oauth2/google&',
        className: 'pre',
        autocomplete: 'off',
        spellcheck: false,
      },
      {
        name: 'getTokenURL',
        type: 'textArea',
        isField: true,
        isDetail: true,
        label: await loc._c('oauth2Client', 'Get token URL'),
        placeholder: 'https://oauth2.googleapis.com/token',
        className: 'pre',
        autocomplete: 'off',
        spellcheck: false,
      },
      {
        name: 'getTokenBody',
        type: 'textArea',
        isField: true,
        isDetail: true,
        label: await loc._c('oauth2Client', 'Get token body'),
        detail: await loc._c('oauth2Client', 'In JSON format with placeholders.'),
        placeholder: '{\n  "code": "{code}",\n  "client_id": "{clientId}",\n  "client_secret": "{clientSecret}",\n  "redirect_uri": "http://localhost:8081/redirection/oauth2/google",\n  "grant_type": "authorization_code"\n}',
        className: 'pre',
        autocomplete: 'off',
        spellcheck: false,
      },
      {
        name: 'authorizationBearerProperty',
        type: 'textArea',
        isField: true,
        isDetail: true,
        label: await loc._c('oauth2Client', 'Property for use in authorization bearer header'),
        placeholder: 'access_token',
        className: 'pre',
        autocomplete: 'off',
        spellcheck: false,
      },
      {
        name: 'getUserInfoURL',
        type: 'textArea',
        isField: true,
        isDetail: true,
        label: await loc._c('oauth2Client', 'Get user info URL'),
        placeholder: 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json',
        className: 'pre',
        autocomplete: 'off',
        spellcheck: false,
      },
      {
        name: 'userInfoUsernameProperty',
        type: 'textArea',
        isField: true,
        isDetail: true,
        label: await loc._c('oauth2Client', 'Name for username property in user info result'),
        placeholder: 'email',
        className: 'pre',
        autocomplete: 'off',
        spellcheck: false,
      },
      {
        name: 'userInfoDisplayNameProperty',
        type: 'textArea',
        isField: true,
        isDetail: true,
        label: await loc._c('oauth2Client', 'Name for display name property in user info result'),
        placeholder: 'name',
        className: 'pre',
        autocomplete: 'off',
        spellcheck: false,
      },
      {
        name: 'createUserIfNotExists',
        type: 'checkbox',
        isField: true,
        isDetail: true,
        label: await loc._c('oauth2Client', 'Create user if not exists'),
        value: false,
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