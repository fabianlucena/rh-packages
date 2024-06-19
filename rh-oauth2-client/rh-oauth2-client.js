import { conf as localConf } from './conf.js';

export const conf = localConf;

conf.configure = configure;
conf.fieldsCache = {};
conf.oauth2ClientsCache = {};

async function configure(global, options) {
  for (const k in options) {
    conf[k] = options[k];
  }

  global.eventBus?.$on('Login.interface.form.get', loginInterfaceFormGet);
  global.eventBus?.$on('OAuth2Client.created', clearCache);
  global.eventBus?.$on('OAuth2Client.updated', clearCache);
  global.eventBus?.$on('OAuth2Client.deleted', clearCache);
}

async function loginInterfaceFormGet(form, options) {
  const oauth2Clients = await getOauth2Clients();
  if (!oauth2Clients?.length) {
    return;
  }

  const language = options?.loc?.language;
  if (conf.fieldsCache[language] === undefined) {
    conf.fieldsCache[language] = [];

    for (const oauth2Client of oauth2Clients) {
      if (!oauth2Client.isEnabled) {
        continue;
      }

      const field = {
        name: oauth2Client.name,
        label: oauth2Client.title,
        type: 'button',
      };
      conf.fieldsCache[language].push(field);
    }
  }

  form.fields.push(...conf.fieldsCache[language]);
}

async function clearCache() {
  conf.fieldsCache = {};
  conf.oauth2ClientsCache = {};
}

async function getOauth2Clients(options) {
  const language = options?.loc?.language;
  if (conf.oauth2ClientsCache[language] === undefined) {
    conf.oauth2ClientsCache[language] = {};
        
    conf.oauth2ClientsCache[language] = await conf.oauth2ClientsService.getList({ loc: options?.loc });
  }

  return conf.oauth2ClientsCache[language];
}