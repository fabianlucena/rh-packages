import { loadJson } from './rf-util-json.js';
import { underscorize } from './rf-util-string.js';

function dateFormat(date) {
  date ??= new Date;

  return date.getFullYear() + '-' + ((date.getMonth() + 1) + '').padStart(2, '0') + '-' + (date.getDate() + '').padStart(2, '0') + ' ' + date.toLocaleTimeString() + '.' + (date.getMilliseconds() + '').padStart(3, '0');
}

export async function loadHttpConfig(options) {
  options ??= {};
  options.defaults ??= {};
  options.defaults.server ??= {};
  options.defaults.server.httpPort =   80;
  options.defaults.server.httpsPort = 443;
    
  const config = await loadConfig(options);

  config.suffix ??= config.env;

  if (config?.db?.logging == 'withAllParameters') {
    config.db.logging = (sql, queryObject) => {
      const prefix = dateFormat() + ' - SQL - ';
      console.log(prefix + 'query - ' + sql.substring(21));
      if (queryObject.bind) {
        console.log(queryObject.bind);
      }
    };
  }

  return config;
}

export async function loadConfig(options) {
  options ??= {};

  const config = {
    path: options.path ?? './config/',
    env: process.env.NODE_ENV ?? options.env ?? 'prod',
    ...options.defaults,
  };

  await mergeJsonFileName(config, config.path + 'global.json', { debug: options.debug });
  await mergeJsonFileName(config, config.path + 'local.json',  { debug: options.debug });
    
  const path = config.path + config.env;
  await mergeJsonFileName(config, path + '.json',        { debug: options.debug });
  await mergeJsonFileName(config, path + '.local.json',  { debug: options.debug });

  const envVariablesOptions = {
    skip: options.skipFromEnv ?? ['path'],
    sanitizeEnvVariable: options.sanitizeEnvVariable ?? 
            {
              HTTP_PORT: 'integer',
              HTTPS_PORT: 'integer',
            },
    debug: options.debug,
  };
  mergeWithEnvVariables(config,        envVariablesOptions);
  mergeWithEnvVariables(config.server, envVariablesOptions);

  return config;
}

async function mergeJsonFileName(config, path, options) {
  const newData = await loadJson(path, { ...options, emptyIfNotExists: true });
  merge(config, newData);
  if (config.load) {
    const path = config.load;
    delete config.load;
    mergeJsonFileName(config, path);
  }

  return config;
}

function merge(dst, src) {
  for (const k in src) {
    if (Array.isArray(src[k])) {
      dst[k] ??= [];
      dst[k].push(...src[k]);
    } else if (typeof src[k] === 'object' && src[k] !== null) {
      if (!dst[k] || typeof dst[k] === 'boolean') {
        dst[k] = {};
      }

      merge(dst[k], src[k]);
    } else {
      dst[k] = src[k];
    }
  }

  return dst;
}

function mergeWithEnvVariables(config, options) {
  options ??= {};
  options.root ??= '';

  for (const name in config) {
    if (options.skip?.includes(name)) {
      if (options.debug) {
        console.log(`Skipping config option: ${name}.`);
      }
            
      continue;
    }

    const NAME = options.root + underscorize(name).toUpperCase();
    if (options.skip?.includes(NAME)) {
      if (options.debug) {
        console.log(`Skipping environment variable: ${NAME}.`);
      }
            
      continue;
    }
        
    const value = config[name];
    if (typeof value === 'object') {
      mergeWithEnvVariables(value, { ...options, root: NAME + '_' });
    } else if (process.env[NAME]) {
      let value = process.env[NAME];
      let isSanitized = false;

      if (options.debug) {
        console.log(`Environment variable founded: ${NAME} = ${value}.`);
      }

      if (options.sanitizeEnvVariable) {
        [value, isSanitized] = sanitizeValue(value, options.sanitizeEnvVariable[NAME], { name: 'NAME' });
      }
            
      if (!isSanitized && options.trySanitizeEnvVariable) {
        [value, isSanitized] = sanitizeValue(value, options.trySanitizeEnvVariable[NAME], { name: 'NAME', skipError: true });
      }

      if (options.debug && isSanitized) {
        console.log(`Environment variable sanitized: ${NAME} = ${value}.`);
      }

      config[name] = value;
    }
  }
}

function sanitizeValue(value, sanitizeMethod, options) {
  if (!sanitizeMethod) {
    return [value, false];
  }

  if (typeof sanitizeMethod === 'function') {
    value = sanitizeMethod(value);
    return [value, true];
  }
    
  if (sanitizeMethod === 'integer') {
    value = value.trim();
    const tryValue = parseInt(value, 10);
    if (!Number.isInteger(tryValue) || tryValue != value) {
      if (options.skipError) {
        return [value, false];
      }

      throw new Error(`Error sanitizing value: "${value}" for environment variable ${options.name}, value is not an integer.`);
    }
        
    return [tryValue, true];
  }

  if (options.skipError) {
    return [value, false];
  }
    
  throw new Error(`Unknown sanitizing method: ${sanitizeMethod}.`);
}