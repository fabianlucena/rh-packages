import { conf } from '../conf.js';
import { Controller } from 'rh-controller';

export class OptionsController extends Controller {
  static getData() {
    const config = conf.global.config;
    const env = config.env;
    const isProd = env === 'prod' || env === 'production';
    const className = config.className ?? (isProd? 'prod': ('no-prod ' + env));
    const title = config.title ?? 'No title';
    const label = config.label ?? (isProd? '': ('Environment: ' + env));

    return {
      env,
      className,
      title,
      label,
    };
  }
}