import { conf } from '../conf.js';
import { Controller } from 'rh-controller';

export class OptionsController extends Controller {
  static getData() {
    const config = conf.global.config;
    const env = config.env;
    const isDev = env === 'dev' || env === 'development';
    const isProd = env === 'prod' || env === 'production' || !isDev;
    const className = config.className ?? (isProd? 'prod': ('no-prod ' + env));
    const title = config.title ?? 'No title';
    const label = config.label ?? (isDev? ('Environment: ' + env) : '');

    return {
      env: isDev? env: 'production',
      className: isDev? className: 'prod',
      title,
      label,
    };
  }
}