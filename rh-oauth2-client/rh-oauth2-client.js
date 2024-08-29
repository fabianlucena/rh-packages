import dependency from 'rf-dependency';
import { conf as localConf } from './conf.js';

export const conf = localConf;

conf.configure = configure;
conf.init = init;
conf.fieldsCache = {};
conf.oauth2ClientsCache = {};

async function configure(global, options) {
  for (const k in options) {
    conf[k] = options[k];
  }

  global.eventBus?.$on('Login.interface.form.get', loginInterfaceFormGet);
  global.eventBus?.$on('OAuth2Client.created',     clearCache);
  global.eventBus?.$on('OAuth2Client.updated',     clearCache);
  global.eventBus?.$on('OAuth2Client.deleted',     clearCache);
}

async function init() {
  conf.oAuth2ClientService = dependency.get('oAuth2ClientService');
  conf.oAuth2StateService =  dependency.get('oAuth2StateService');
}

async function loginInterfaceFormGet({ form, options }) {
  const items = await getFieldsFromCache(options);
  for (const item of items) {
    const clientState = await conf.oAuth2StateService.create({ oAuth2ClientId: item.client.id });
    form.fields.push({ ...item.field, href: item.field.href + clientState.state });
  }
}

async function getFieldsFromCache(options) {
  const language = options?.loc?.language;
  if (conf.fieldsCache[language]) {
    return conf.fieldsCache[language];
  }
    
  conf.fieldsCache[language] = [];

  const oauth2Clients = await getOAuth2Clients();
  if (!oauth2Clients?.length) {
    return conf.fieldsCache[language];
  }

  for (const oauth2Client of oauth2Clients) {
    if (!oauth2Client.isEnabled) {
      continue;
    }

    const urlReplacements = {
      '{sessionIndex}': '{sessionIndex}',
      '{deviceToken}':  '{deviceToken}',
      '{host}':         '{host}',
      '{protocol}':     '{protocol}',
      '{protocolHost}': '{protocolHost}',
    };
    let state = '{sessionIndex},{deviceToken},';

    const field = {
      name: oauth2Client.name,
      type: 'link',
      innerHTML: oauth2Client.title,
      innerIcon: oauth2Client.icon,
      href: oauth2Client.requestURL.replace(/\s/g, '') + '&state=' + state,
      urlReplacements,
    };
    conf.fieldsCache[language].push({ client: oauth2Client, field, state });
  }

  return conf.fieldsCache[language];
}

async function clearCache() {
  conf.fieldsCache = {};
  conf.oauth2ClientsCache = {};
}

async function getOAuth2Clients(options) {
  const language = options?.loc?.language;
  if (conf.oauth2ClientsCache[language] === undefined) {
    conf.oauth2ClientsCache[language] = await conf.oAuth2ClientService.getList({ loc: options?.loc });
  }

  return conf.oauth2ClientsCache[language];
}