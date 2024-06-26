import { LogoutService } from '../services/logout.js';
import { conf } from '../conf.js';

export class LogoutController {
  static async post(req, res) {
    if (!req.session) {
      res.status(401).send({ error: await req.loc._c('logout', 'No session') });
      req.log?.info('Error to logout no session.');
    }

    await LogoutService.singleton().logout(req.session);
    await conf.global.eventBus?.$emit('logout', req.session.id);
    req.log?.info('Logout session closed.', { sessionId: req.session.id });

    delete req.session;
    res.status(204).send();
  }
}