import { Controller } from 'rh-controller';
import { getOptionsFromParamsAndOData } from 'http-util';
import dependency from 'rf-dependency';

export class LogController extends Controller {
  constructor() {
    super();

    this.service = dependency.get('logService');
  }

  getPermission = 'log.get';
  async getData(req, res) {
    let options = {
      view: true,
      limit: 10,
      offset: 0,
      orderBy: [['dateTime', 'DESC']],
      loc: req.loc,
      include: { user: true },
    };

    options = await getOptionsFromParamsAndOData(req?.query, null, options);
    const result = await logService.getListAndCount(options);

    res.status(200).send(result);
  }

  async getGrid(req, res) {
    const actions = [/*'view', */'search', 'paginate'];
                
    let loc = req.loc;

    res.status(200).send({
      title: await loc._c('log', 'Log'),
      load: {
        service: 'log',
        method: 'get',
      },
      actions: actions,
      columns: [
        {
          name: 'dateTime',
          type: 'dateTime',
          format: '%x %X.%f',
          label: await loc._c('log', 'Date time'),
        },
        {
          name: 'ref',
          type: 'text',
          label: await loc._c('log', 'Ref'),
        },
        {
          name: 'type',
          type: 'text',
          label: await loc._c('log', 'Type'),
        },
        {
          name: 'Session.User.username',
          type: 'text',
          label: await loc._c('log', 'User'),
        },
        {
          name: 'sessionId',
          type: 'text',
          label: await loc._c('log', 'Session'),
        },
        {
          name: 'message',
          type: 'text',
          label: await loc._c('log', 'Message'),
        },
      ],
      details: [
        {
          name: 'data',
          type: 'object',
          label: await loc._c('log', 'Data'),
        },
      ]
    });
  }
}