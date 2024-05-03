import { Controller } from 'rh-controller';

export class HelloController extends Controller {
  static get() {
    return 'Hello world!';
  }
}