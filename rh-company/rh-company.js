import { conf as localConf } from './conf.js';

export const conf = localConf;

conf.configure = configure;

async function configure(global, options) {
  if (options?.filters) {
    conf.filters = options.filters;
  }
}