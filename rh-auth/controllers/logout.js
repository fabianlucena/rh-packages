import { makeContext } from 'http-util';
import { conf } from '../conf.js';
import dependency from 'rf-dependency';

export class LogoutController {
  static async post(req, res) {
    if (!req.session) {
      res.status(401).send({ error: await req.loc._c('logout', 'No session') });
      req.log?.info('Error to logout no session.');
    }

    const logoutService = dependency.get('logoutService');
    await logoutService.logout(req.session);
    await conf.global.eventBus?.$emit('logout', { sessionId: req.session.id, context: makeContext(req, res) });
    req.log?.info('Logout session closed.', { sessionId: req.session.id });

    delete req.session;
    res.status(204).send();
  }
}