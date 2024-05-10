import { deepMerge, complete } from 'rf-util';
import chai from 'chai';
import chaiHttp from 'chai-http';

chai.use(chaiHttp);
const expect = chai.expect;

export const rt = {
  app: null,
  agent: null, 
  headers: {},

  createAgent(app) {
    return chai.request.agent(app ?? rt.app);
  },

  createRequest(app) {
    return chai.request(app ?? rt.app);
  },

  initAgent(app) {
    rt.agent = rt.createAgent(app);

    return rt.agent;
  },

  getAgent(app) {
    if (app || !rt.agent) {
      rt.initAgent(app);
    }

    return rt.agent;
  },

  /**
   * Test and endpoint
   * @param {*} options values to setup the test. This parameter can be an Array of test definitions objecta to send each of ones to @see rt.testEndPointMethodSend(test) method, or an object. If it is an object an array is created to send to @see rt.testEndPointMethodSend(test) method.
   * Object properties:
   * {
   *  agent: agent        agent or require object.
   *  url: url            URL of the endpoint to test.
   *  headers:            optional JSON headers to send.
   *  query: query        optional query to send as get parameters.
   *  [others]            others root properties but notAllowedMethods, send, get, post, put, patch, delete, options, head; will be used as default values for each test. @see rt.testEndPointMethodSend(test) for the rest of properties.
   *  trace: true         show partial construction of the tests
   * 
   *  notAllowedMethods:  comma separated strings, list of strings, or object of type {method: options} to check for method not allowed. If the name of the method is prefixed with ! the method is skipped. If this is a string or a list, whis will be cnverted to object: {method: true, ...} or {method: false} if the method name is prefixed with !.
   *      true            for true values the default values are:
   *      {
   *          status: 405,
   *          empty: true|false,                          true for the head method, undefined for the rest.
   *          haveProperties = undefined|['error'],       undefined for the head method, ['error'] for the rest.
   *      }
   * 
   *  [method]:                       options to check HTTP methods: send, get, post, put, patch, delete, options, head. For the options @see rt.testEndPointMethodSend(test) method. This value can be an array of tests or a object. For array each test is completed with the default root options and the methos name defined. For object the default properties can be overrided.
   *      For object:
   *          send:                   list of each test to perform. If this option is not defined a single test is performed. @see rt.testEndPointMethodSend(test) for the options.
   *          $form:                  perform a get with $form query parameter to get the form. Valid options are:
   *          {
   *              status: 200,        expected status @see rt.checkStatus() for the options.
   *              haveProperties = 'error',
   *              query: '$form',
   *              title: 'should get a form usign $form query parameter',
   *          }
   *          $grid:                  perform a get with $grid query parameter to get the grid. Valid options are:
   *          {
   *              status: 200,        expected status @see rt.checkStatus() for the options.
   *              haveProperties = 'error',
   *              query: '$grid',
   *              title: 'should get a form usign $grid query parameter',
   *          }
   *          noParametersError:      test the endpoint for an error on method without parameters
   *          noQueryError:           test the endpoint for an error on method without query parameters
   *          {
   *              status: 400,
   *              haveProperties: 'error',
   *              title: 'should get a no parameters error',
   *          }, 
   *          missingParameters:      perform a test for missing parameters and expect an error. This is a list of lists. For each item of the master list a test is performed, without the parameters in the child list. For the right behavior the parameters used must exist as parameters in the parameters option in the parent level.
   *          [
   *              ['param1', 'param2'],
   *              ['param1'],
   *              ['param2']
   *          ]
   * }
   * @example
   * {
   *   agent: agent,                                              // agent is defined as global variable: agent = chai.request.agent(app);
   *   url: '/api/login',                                         // endpoint URL to test
   *   notAllowedMethods: 'PUT,PATCH,DELETE',                     // not allowed methods for this endpoint
   *   get: [                                                     // test for GET HTTP method using array
   *      'noParametersError',                                    // test for no parameters expect error
   *      'noQueryError',    
   *      {                                                       // begin test definition for get form
   *          $form: true,                                        // test for get form using the $form as query parameter '/api/login?$form'
   *          $grid: true,                                        // test for get form using the $grid as query parameter '/api/login?$grid'
   *          haveProperties: ['username', 'password']            // check for the result exists the properties username andpassword
   *      },
   *   ],
   *   post: {                                                    // test for POST HTTP method using object
   *      parameters: {                                           // default parameters options for the rest of tests
   *          username: 'admin',
   *          password: '1234'
   *      },
   *      send: [                                                 // test definitions
   *          'noParametersError',                                // test for no parameters expect error (same as above)
   *          {                                                   // begin test definition for missingParameters
   *              missingParameters: [                       
   *                  ['username', 'password'],                   // test for no parameters body = {}
   *                  ['username'],                               // test for no parameters username
   *                  ['password']                                // test for no parameters password
   *              ]
   *          },
   *          {                                                   // begin custom test item for Invalid login
   *              title: '"Invalid login" login error',           // test title
   *              parameters: {                                   // override parameters for introduce an error
   *                  username: 'admin',
   *                  password: '12345'
   *              },
   *              status: 403,                                    // expected status
   *              haveProperties: 'error',                        // expected property error in the result
   *              propertyContains: {                             // expected message 'Invalid login' in the property message in the result
   *                  message: 'Invalid login'
   *              }
   *          },
   *          {                                                                               // begin custom test item for login
   *              title: 'login should returns a valid session authToken',
   *              status: 201,                                                                // expected status
   *              haveProperties: ['authToken', 'index'],                                     // expected properties in the result
   *              after: res => headers.Authorization = `Bearer ${res.body.authToken}`,       // after succesfull test, store the authToken for reuse as authorization header
   *          },
   *          {
   *              title: 'should returns a distinct valid session authToken',                 // begin custom test item for another login a distinct authToken is espected
   *              status: 201,
   *              haveProperties: ['authToken', 'index'],
   *              after: res => expect(headers.Authorization).to.be.not.equals(`Bearer ${res.body.authToken}`),    // after succesfull test, use a custom check to verify the authToken
   *          },
   *      ]
   * }
   * 
   * @example of use for before and after
   * {
   *   agent: agent,
   *   url: '/api/not-found',
   *   get: [
   *       {
   *           title: 'should get a value for cookie device',
   *           haveCookies: 'device',
   *           after: res => cookies.device = httpUtil.cookies(res, 'device', 'value')    // after succesfull test, store the cookie
   *       },
   *       {                                                                              // in a second call with the cookie (automatic for the same agent) no cookie is expected
   *           title: 'should not get a cookie device',
   *           noHaveCookies: 'device',
   *       },
   *       {
   *           agent: chai.request(app),                                                  // override the agent to get another cookie
   *           title: 'should get a distinct cookie device',
   *           haveCookies: 'device',
   *           before: test => test.noHaveCookies = {device: cookies.device},             // before send this request update the test for check the cookie distint to the stored one
   *       },
   *   ]
   * }
   */
  testEndPoint(tests) {
    if (typeof tests === 'object') {
      const options = tests;
      tests = [];

      const defaultOptions = {};
      for (const k in options) {
        if (!['notAllowedMethods', 'send', 'get', 'post', 'put', 'patch', 'options', 'delete'].includes(k)) {
          defaultOptions[k] = options[k];
        }
      }

      if (options.notAllowedMethods) {
        let notAllowedMethods = options.notAllowedMethods;
        if (typeof notAllowedMethods === 'string') {
          notAllowedMethods = notAllowedMethods.split(/[,;]/);
        }

        if (Array.isArray(notAllowedMethods)) {
          let notAllowedMethodsOptions = {};
          for (const i in notAllowedMethods) {
            let method = notAllowedMethods[i].trim();
            if (method[0] == '!') {
              notAllowedMethodsOptions[method.substring(1)] = false;
            } else {
              notAllowedMethodsOptions[method] = true;
            }
          }
    
          notAllowedMethods = notAllowedMethodsOptions;
        }

        for (const notAllowedMethod in notAllowedMethods) {
          const testOptions = notAllowedMethods[notAllowedMethod];
          const test = {};
          if (!testOptions) {
            test.skip = true;
          } else if (typeof testOptions === 'object') {
            for (const k in testOptions) {
              test[k] = testOptions[k];
            }
          }

          if (test.status === undefined) {
            test.status = 405;
          }

          if (test.method === undefined) {
            test.method = notAllowedMethod.trim().toLowerCase();
          }
    
          if (test.json === undefined && test.haveProperties === undefined && test.empty === undefined) {
            if (test.method === 'head') {
              test.empty = true;
            } else {
              test.haveProperties = ['error'];
            }
          }

          for (const k in defaultOptions) {
            if (test[k] === undefined) {
              test[k] = defaultOptions[k];
            }
          }

          if (test.title === undefined) {
            test.title = `${test.method.toUpperCase()} HTTP method not allowed`;
          }

          tests.push(test);
        }
      }

      let haveAnyMethod = false;
      for (const method in { notAllowedMethods: true, send: true, get: true, post: true, put: true, patch: true, delete: true, options: true, head: true }) {
        if (options[method]) {
          haveAnyMethod = true;
          break;
        }
      }

      if (!haveAnyMethod) {
        if (options.method && options[options.method] === undefined) {
          options[options.method] = true;
        } else {
          options.get = true;
        }
      }

      if (options.trace) {
        console.log(options);
      }

      for (const method in { send: true, get: true, post: true, put: true, patch: true, delete: true, options: true, head: true }) {
        let methodOptions = options[method];
        if (methodOptions === undefined) {
          continue;
        }

        if (methodOptions.trace) {
          console.log(methodOptions);
        }

        if (Array.isArray(methodOptions)) {
          methodOptions = { send: methodOptions };
        } else if (methodOptions === false) {
          methodOptions = { skip: true };
        } else if (typeof methodOptions !== 'object') {
          methodOptions = {};
        }

        if (methodOptions.send === undefined) {
          methodOptions.send = [{}];
        }

        const send = methodOptions.send;
        for (const i in send) {
          let test = send[i];
          if (typeof test === 'string') {
            let name = test;
            test = {};

            if (name[0] == '!') {
              test[name.substring(1)] = true;
              test.skip = true;
            } else {
              test[name] = true;
            }
          }

          if (test.method === undefined) {
            if (method !== 'send') {
              test.method = method;
            } else if (defaultOptions.method) {
              test.method = defaultOptions.method;
            } else {
              test.method = 'get';
            }
          }
    
          for (const k in methodOptions) {
            if (test[k] === undefined && k !== 'send') {
              test[k] = methodOptions[k];
            }
          }

          for (const k in defaultOptions) {
            if (test[k] === undefined) {
              test[k] = defaultOptions[k];
            }
          }

          const paramTypes = {
            missingParameters: {
              container: 'parameters',
            },
            missingQuery: {
              container: 'query',
            },
          };
          let pushed = false;
          for (const paramType in paramTypes) {
            if (test[paramType] === undefined) {
              continue;
            }

            const paramOptions = paramTypes[paramType];
            const containerName = paramOptions.container;

            if (!test[containerName]) {
              throw new Error (`trying to define a missing ${containerName} test without ${containerName}.`);
            }

            if (!test[paramType]) {
              test.skip = true;
            }

            let missing = test[paramType];
            delete test[paramType];
            if (!Array.isArray(missing)) {
              missing = [missing];
            }

            for (const i in missing) {
              const thisTest = {};
              thisTest[containerName] = {};
              for (const k in test) {
                if (k !== 'title' && k !== containerName) {
                  thisTest[k] = test[k];
                }
              }

              let thisMissing = missing[i];
              if (!Array.isArray(thisMissing)) {
                thisMissing = thisMissing.split(',');
              }

              for (const k in test[containerName]) {
                if (!thisMissing.includes(k)) {
                  thisTest[containerName][k] = test[containerName][k];
                }
              }

              if (!thisTest.title) {
                thisTest.title = `${thisTest.method.toUpperCase()} should get a missing parameter in ${containerName} error for parameters: ${thisMissing.join(', ')}`;
              }
                            
              if (thisTest.status === undefined) {
                thisTest.status = 400;
              }

              if (thisTest.haveProperties === undefined) {
                thisTest.haveProperties = 'error';
              }

              if (thisTest.propertyContains === undefined) {
                thisTest.propertyContains = { missingParameters: thisMissing };
              }

              pushed = true;
              tests.push(thisTest);
            }
          }

          if (!pushed || test.get || test.post || test.put || test.patch || test.delete || test.options || test.head) {
            tests.push(test);
          }
        }
      }
    }

    const helpers = {
      noParametersError: {
        status: 400,
        haveProperties: 'error',
        title: 'should get a no parameters error',
        helperMethod: test => delete test.parameters,
      }, 
      noQueryError: {
        status: 400,
        haveProperties: 'error',
        title: 'should get a no parameters error',
        helperMethod: test => delete test.query,
      },
      $form: {
        status: 200,
        query: '$form',
        title: 'should get a form usign $form query parameter',
        haveProperties: [
          'action',
          'fields',
        ],
        helperMethod: test => delete test['$form'],
      },
      $grid: {
        status: 200,
        query: '$grid',
        title: 'should get a grid usign $grid query parameter',
        haveProperties: [
          'actions',
          'columns',
        ],
        helperMethod: test => delete test['$grid'],
      },
    };
    const defaultMethodsOptions = {
      get: {
        status: 200,
      },
      head: {
        status: 204,
      },
      post: {
        status: 204,
      },
      put: {
        status: 201,
      },
      patch: {
        status: 204,
      },
      delete: {
        status: 204,
      },
      options: {
        status: 204,
      },
    };
    const newTests = [];
    for (const i in tests) {
      const test = tests[i];
      for (const helper in helpers) {
        if (test[helper] !== undefined) {
          if (typeof test[helper] === 'object') {
            for (const k in test[helper]) {
              test[k] = test[helper][k];
            }
          } else if (!test[helper]) {
            test.skip = false;
          }

          const defaultData = helpers[helper];
          for (const k in defaultData) {
            if (test[k] === undefined && k !== 'helperMethod') {
              if (k === 'title') {
                test[k] = `${test.method.toUpperCase()} ${defaultData[k]}`;
              } else {
                test[k] = defaultData[k];
              }
            }
          }

          if (defaultData.helperMethod) {
            defaultData.helperMethod(test);
          }

          delete test[helper];
        }
      }
      const defaultMethodOptions = defaultMethodsOptions[test.method];
      if (defaultMethodOptions) {
        for (const k in defaultMethodOptions) {
          if (test[k] === undefined) {
            test[k] = defaultMethodOptions[k];
          }
        }
      }

      if (rt.cors?.prefligth !== undefined && test.corsPrefligth === undefined) {
        test.corsPrefligth = rt.cors?.prefligth;
      }

      if (test.corsPrefligth && test.method.toLowerCase() != 'options') {
        let corsPrefligthTest;
        if (typeof test.corsPrefligth === 'string') {
          corsPrefligthTest = { title: test.corsPrefligth };
        } else if (typeof test.corsPrefligth === 'object') {
          corsPrefligthTest = { ...test.corsPrefligt };
        } else {
          corsPrefligthTest = {};
        }

        corsPrefligthTest = {
          title: 'Preflight for: ' + test.title,
          url: test.url,
          method: 'options',
          status: [204,200],
          headers: {
            'Access-Control-Request-Headers': 'Content-Type',
            'Access-Control-Request-Method': test.method.toUpperCase(),
          },
          haveHeaders: {
            'Access-Control-Allow-Headers': [/\bContent-Type\b/i],
          },
          ...corsPrefligthTest,
        };

        if (test.status === 405) {
          corsPrefligthTest.noHaveHeaders = { 'Access-Control-Allow-Methods': new RegExp(`\\b${test.method.toUpperCase()}\\b`, 'i') };
        } else {
          corsPrefligthTest.haveHeaders['Access-Control-Allow-Methods'] = new RegExp(`\\b${test.method.toUpperCase()}\\b`, 'i');
        }

        if (test.headers?.Authorization) {
          corsPrefligthTest.headers['Access-Control-Request-Headers'] = 
            ((corsPrefligthTest.headers['Access-Control-Request-Headers'] ?? '')
            + ' Authorization').trim();

          corsPrefligthTest.haveHeaders['Access-Control-Allow-Headers'].push(/\bAuthorization\b/i);
        }

        if (rt.cors?.origin) {
          corsPrefligthTest.headers['Origin'] = rt.cors.origin;
          corsPrefligthTest.haveHeaders['Access-Control-Allow-Origin'] = new RegExp(`\\b${rt.cors.origin}\\b`);
        }

        delete test.corsPrefligth;
        newTests.push(corsPrefligthTest);
      }

      newTests.push(test);
    }
    tests = newTests;

    for (const i in tests) {
      rt.testEndPointMethodSend(tests[i]);
    }
  },

  /**
   * Send a test to an endpoint.
   * @param {*} test test definition.
   * {
   *  test: it || it.skip || it.only  method name to perform the test.
   *  title: title                    the test title. If it is not provided a default title is created.
   *  method: get|post|put|...        HTTP method to call the endpoint. If it is not provided uses a get.
   *  headers: headers                JSON headers to send to the endpoint.
   *  before: method                  method to call before send the request.
   *  check: method                   method to call after the request to check the response with the response and the test as paramaters. If it is not defined uses @see rt.checkReponse method.
   *  requestLog: true|string|list    show a console.log of listed items from request. It this is true showe all calculates test options
   *  logRequest: true|string|list    alias for requestLog
   *  [checkOptions]                  options for checking the response @see rt.checkReponse for detail.
   * }
   */
  testEndPointMethodSend(test) {
    if (test.test === undefined) {
      if (test.only) {
        test.test = it.only;
      } else if (test.skip) {
        test.test = it.skip;
      } else {
        test.test = it;
      }
    }

    if (this.includesEndpoint
      && !test.overrideIncludesEndpointCheck
      && !this.includesEndpoint(test.url)
    ) {
      test.test = it.skip;
    }

    if (!test.title) {
      test.title = `${test.method.toUpperCase()} ${test.url}`;
      if (test.status) {
        test.title += ` should return a ${test.status} HTTP status code`;
      }
    }
            
    if (!test.method) {
      test.method = 'get';
    }

    if (test.autoLogin) {
      this.autoLogin(test.autoLogin);
    }

    test.test(test.title, done => {
      if (!test.agent) {
        test.agent = rt.agent;

        if (!test.agent && rt.app) {
          test.agent = chai.request(rt.app);
        }
      }
            
      if (test.base === undefined) {
        test.base = rt.base;
      }

      if (!test.headers) {
        test.headers = rt.headers ?? {};
      }

      if (!test.query) {
        test.query = {};
      }

      if (!test.parameters) {
        test.parameters = {};
      }
                
      if (test.before) {
        test.before(test);
      }

      if (test.requestLog === undefined && test.logRequest !== undefined) {
        test.requestLog = test.logRequest;
      }

      if (test.requestLog) {
        let requestLog = test.requestLog;
        if (typeof requestLog === 'string') {
          requestLog = requestLog.split(',');
        }
    
        const message = {};
        if (Array.isArray(requestLog)) {
          for (const i in requestLog) {
            const k = requestLog[i];
            message[k] = test[k];
          }
        } else if (requestLog === true) {
          for (const k in test) {
            message[k] = test[k];
          }

          if (message.agent) {
            if (message.agent === rt.agent) {
              message.agent = 'custom';
            } else {
              message.agent = true;
            }
          }
        }

        if (message) {
          console.log(message);
        }
      }

      test.agent[test.method]((test.base ?? '') + test.url)
        .set(test.headers ?? {})
        .query(test.query ?? {})
        .send(test.parameters ?? {})
        .end((err, res) => {
          if (err) {
            console.error(err);
          } else if (test.check) {
            test.check(res, test);
          } else {
            rt.checkReponse(res, test);
          }

          done();
        });
    });
  },

  /**
   * Check the response for given options
   * @param {*} res response
   * @param {*} options options to check the response. Valid options are:
   *  {
   *    status: 200,                    check the status code if exists except if is undefined or false, @see rt.checkStatus for reference.
   *    haveCookies: cookies            check the headers response for the given cookies to exists. This option can be a string for a single cookie, a list for multiple cookies, or a object in this case check the cookies value.
   *    noHaveCookies: cookies          check the headers response for the given cookies to not exists. This option can be a string for a single cookie, a list for multiple cookies, or a object in this case check the cookies to be distinct value.
   *    empty: true,                    check the response body to be empty.
   *    json: true,                     check the response body to be a JSON. If this option is not specified but haveProperties or noHaveProperties it is this option will be set to true.
   *    bodyLengthOf: int               check the response body to have the given items bodyLengthOf.
   *    checkItem: int|string           search a specific item in the body to check
   *    lengthOf: int                   check the value to have the given items lengthOf.
   *    lengthOfContainer: int          check the container of checkItem to have the given items lengthOfContainer.
   *    haveProperties: properties,     check the value for the given properties to exist. This option can be a string for a comma separated properties, a list for multiple properties, or a object in this case check the properties value.
   *    noHaveProperties: properties,   check the value for the given properties to not exist. This option can be a string for a comma separated properties, a list for multiple properties, or a object in this case check the properties to be distinct value.
   *    propertyContains: {             check the value to have a property and its value contains the given values.
   *      propertyName: ['one', 'two']
   *    },
   *    after: method                   call the method with the parameters: response, value, and container of value.
   *    log: true|string|list           show a console.log of listed items from response. It this is true uses: [status, body]
   *  }
   */
  checkReponse(res, options) {
    if (options.log) {
      let log = options.log;
      if (log === true) {
        log = ['status', 'body'];
      } else if (typeof log === 'string') {
        log = log.split(',');
      }

      const message = {};
      for (const i in log) {
        const k = log[i];
        message[k] = res[k];
      }

      console.log(message);
    }

    rt.checkStatus(res, options);

    if (options.haveHeaders) {
      let haveHeaders = options.haveHeaders;
      if (typeof haveHeaders === 'string') {
        haveHeaders = { haveHeaders: true };
      } else if (Array.isArray(haveHeaders)) {
        const newHaveHeaders = {};
        haveHeaders.forEach(header => newHaveHeaders[header] = true);
        haveHeaders = newHaveHeaders;
      }

      for (let header in haveHeaders) {
        let values = haveHeaders[header];
        if (!Array.isArray(values)) {
          values = [values];
        }

        values.forEach(value => {
          if (value === true) {
            expect(res).to.have.header(header);
          } else if (value === false) {
            expect(res).to.not.have.header(header);
          } else {
            expect(res).to.have.header(header, value);
          }
        });
      }
    }

    if (options.noHaveHeaders) {
      let noHaveHeaders = options.noHaveHeaders;
      if (typeof noHaveHeaders === 'string') {
        noHaveHeaders = { noHaveHeaders: true };
      } else if (Array.isArray(noHaveHeaders)) {
        const newNoHaveHeaders = {};
        noHaveHeaders.forEach(header => newNoHaveHeaders[header] = true);
        noHaveHeaders = newNoHaveHeaders;
      }

      for (let header in noHaveHeaders) {
        let values = noHaveHeaders[header];
        if (!Array.isArray(values)) {
          values = [values];
        }

        values.forEach(value => {
          if (value === true) {
            expect(res).to.not.have.header(header);
          } else if (value === false) {
            expect(res).to.have.header(header);
          } else {
            expect(res).to.not.have.header(header, value);
          }
        });
      }
    }

    if (options.haveCookies) {
      let haveCookies = options.haveCookies;
      if (typeof haveCookies === 'string')
        haveCookies = [haveCookies];

      if (Array.isArray(haveCookies)) {
        for (const i in haveCookies) {
          expect(res).to.have.cookie(haveCookies[i]);
        }
      } else if (typeof haveCookies === 'object') {
        for (const cookie in haveCookies) {
          expect(res).to.have.cookie(cookie, haveCookies[cookie]);
        }
      } else {
        throw new Error('error to check cookies values. haveCookies option must be a string for a single cookie, a list or a object');
      }
    }

    if (options.noHaveCookies) {
      let noHaveCookies = options.noHaveCookies;
      if (typeof noHaveCookies === 'string') {
        noHaveCookies = [noHaveCookies];
      }

      if (Array.isArray(noHaveCookies)) {
        for (const i in noHaveCookies) {
          expect(res).to.not.have.cookie(noHaveCookies[i]);
        }
      } else if (typeof noHaveCookies === 'object') {
        for (const cookie in noHaveCookies) {
          expect(res).to.not.have.cookie(cookie, noHaveCookies[cookie]);
        }
      } else {
        throw new Error('error to check cookies values. noHaveCookies option must be a string for a single cookie, a list or a object');
      }
    }

    if (options.empty) {
      expect(res.text).to.be.empty;
    }

    if (options.haveProperties || options.noHaveProperties || options.bodyLengthOf || options.lengthOf || options.lengthOfContainer) {
      if (options.json === undefined) {
        options.json = true;
      }
    }

    if (options.json) {
      expect(res).to.be.json;
    }

    if (options.bodyLengthOf) {
      expect(res.body).to.have.lengthOf(options.bodyLengthOf);
    }

    let value = res.body;
    let container = res;
    if (options.checkItem === true) {
      if (typeof value === 'object' && value.rows) {
        container = value;
        value = value.rows;
        if (Array.isArray(value) && value.length) {
          container = value;
          value = value[0];  
        }
      }
    } else if (options.checkItem !== undefined) {
      if (Array.isArray(options.checkItem)) {
        for (const i of options.checkItem) {
          expect(value).to.have.property(i);
          if (i in value) {
            container = value;
            value = value[i];
          } else {
            throw new Error(`result does not have ${i} property`);
          }
        }
      } else {
        container = value;
        value = value[options.checkItem];
      }
    }

    if (options.lengthOf) {
      expect(value).to.have.lengthOf(options.lengthOf);
    }

    if (options.lengthOfContainer) {
      expect(container).to.have.lengthOf(options.lengthOfContainer);
    }

    if (options.haveProperties) {
      let haveProperties = options.haveProperties;
      if (typeof haveProperties === 'string') {
        haveProperties = haveProperties.split(',').map(item => item.trim());
      }

      if (Array.isArray(haveProperties)) {
        for (const i in haveProperties) {
          expect(value).to.have.property(haveProperties[i]);
        }
      } else if (typeof haveProperties === 'object') {
        for (const cookie in haveProperties) {
          expect(value).to.have.property(cookie, haveProperties[cookie]);
        }
      } else {
        throw new Error('error to check body result values. haveProperties option must be a string for a single property, a list or a object');
      }
    }

    if (options.noHaveProperties) {
      let noHaveProperties = options.noHaveProperties;
      if (typeof noHaveProperties === 'string') {
        noHaveProperties = noHaveProperties.split(',').map(item => item.trim());
      }

      if (Array.isArray(noHaveProperties)) {
        for (const i in noHaveProperties) {
          expect(value).to.not.have.property(noHaveProperties[i]);
        }
      } else if (typeof noHaveProperties === 'object') {
        for (const property in noHaveProperties) {
          expect(value).to.not.have.property(property, noHaveProperties[property]);
        }
      } else {
        throw new Error('error to check body result values. noHaveProperties option must be a string for a single property, a list or a object');
      }
    }

    if (options.propertyContains) {
      for (const property in options.propertyContains) {
        const values = expect(value).to.have.property(property);
        const contains = options.propertyContains[property];
        if (Array.isArray(contains)) {
          values.contains(...contains);
        } else {
          values.contains(contains);
        }
      }
    }

    if (options.after) {
      options.after(res, value, container);
    }
  },

  /**
   * Checks the status code
   * @param {*} res response
   * @param {*} options options to check the status response. Valid values are:
   *  positive integer                any number and equality is checked
   *  negative integer                any number and if the number exists in the response the check is not passed
   *  RegExp                          regular expression to test against the status response
   *  string                          string can be:
   *      '200'                       a number to check for positive
   *      '!200'                      a number prefixed with !, to check for negative
   *      '2xx' | '!2xx'              the "x" represent any number in that place
   *  Array                           A list of any prior values. The first match resolve the entire check list for the positive or for the negative way.
   *  Comma separated strings         It is interpreted as Array
   *      '!2xx,!4xx'
   * @returns 
   */
  checkStatus(res, options) {
    if (!options.status) {
      return;
    }

    if (Number.isInteger(options.status)) {
      if (options.status > 0) {
        expect(res).to.have.status(options.status);
      } else {
        expect(res).to.not.have.status(-options.status);
      }

      return;
    }
        
    let expectedStatusList = options.status;
    if (!Array.isArray(expectedStatusList)) {
      if (typeof expectedStatusList === 'string') {
        expectedStatusList = expectedStatusList.split(',').map(s => s.trim());
      } else if (expectedStatusList instanceof RegExp) {
        expectedStatusList = [expectedStatusList];
      } else {
        throw new Error(`cheking for status ${expectedStatusList} is unknown`);
      }
    }

    const status = res.status;
    for (const i in expectedStatusList) {
      const expectedStatus = expectedStatusList[i];
      if (expectedStatus instanceof RegExp) {
        if (expectedStatus.test(status)) {
          return expect(res).to.have.status(status);
        }
      } else if (Number.isInteger(expectedStatus)) {
        if (expectedStatus > 0) {
          if (expectedStatus === status) {
            return expect(res).to.have.status(status);
          }
        } else {
          if (-expectedStatus === status) {
            expect(res).to.not.have.status(status);
          }
        }
      } else if (typeof expectedStatus === 'string') {
        const checkType = expectedStatus[0] !== '!';
        let expectedStatusRegExp = expectedStatus.replaceAll('x', '\\d');
        if (!checkType) {
          expectedStatusRegExp = expectedStatusRegExp.substring(1);
        }

        expectedStatusRegExp = new RegExp('^' + expectedStatusRegExp + '$');
        if (expectedStatusRegExp.test(status)) {
          if (checkType) {
            return expect(res).to.have.status(status);
          } else {
            return expect(res).to.not.have.status(status);
          }
        }
      } else {
        throw new Error(`cheking for status ${expectedStatus} is unknown`);
      }
    }
  },

  /**
   * Perform a HTTP not allowed method testa on an end point expect errors. This method uses the @see rt.testEndPoint with get: {noParametersError: true} options.
   * @param {*} options options for the method @see rt.testEndPoint method.
   * @param  {...srting} notAllowedMethods method names to check not allwoed.
   * @returns 
   */
  testNotAllowedMethod(options, ...notAllowedMethods) {
    options = deepMerge(options, { notAllowedMethods });

    rt.testEndPoint(options);
  },

  /**
   * Perform a get test on an end point for no parameters and expect an error. This method uses the @see rt.testEndPoint with get: {noParametersError: true} options.
   * @param {*} options options for the method @see rt.testEndPoint method.
   */
  testGetNoParametesError(options) {
    options = deepMerge(options, { get: { noParametersError: true }});

    rt.testEndPoint(options);
  },

  /**
   * Perform a test on an end point to get the form using the $form query get 
   * parameter. This method uses the @see rt.testEndPoint with get: 
   * {
   *  $form: {haveProperties: haveProperties}
   * } options.
   * @param {*} options options for the method @see rt.testEndPoint method.
   * @param  {...string} haveProperties properties names to check in the result.
   */
  testGetForm(options, ...haveProperties) {
    options = deepMerge(
      options,
      {
        get: {
          $form: {
            haveProperties,
          },
        },
      },
    );

    rt.testEndPoint(options);
  },

  /**
   * Perform a test on an end point to get the grid using the $grid query get 
   * parameter. This method uses the @see rt.testEndPoint with get:
   * {
   *  $grid: { haveProperties: haveProperties }
   * } options.
   * @param {*} options options for the method @see rt.testEndPoint method.
   * @param  {...string} haveProperties properties names to check in the result.
   */
  testGetGrid(options, ...haveProperties) {
    options = deepMerge(
      options,
      {
        get: {
          $grid: {
            haveProperties,
          },
        },
      },
    );

    rt.testEndPoint(options);
  },

  /**
   * Perform a login in the endpoint sending a post to the endpoint. This method uses @see rt.testEndPoint.
   * @param {*} options options to use the @see rt.testEndPoint.
   * Other options are:
   *  credentials:    here you can specify the parameters,
   *  username:       here you can specify the username of credentials,
   *  password:       here you can specify the password of credentials,
   * Username and password are used for create the credentials: {username, password}.
   * This method uses as default values:
   * {
   *  title: 'login should returns a valid session authToken',
   *  url: '/login',
   *  method: 'post',
   *  parameters: rt.credentials,
   *  status: 201,
   *  haveProperties: ['authToken', 'index'],
   *  send: {},
   * }
   * 
   * For use as method other than send you must set send to false or [];
   */
  testLogin(options) {
    options = complete(
      options,
      {
        title: 'login endpoint should returns a valid session authToken',
        url: '/login',
        method: 'post',
        credentials: rt.credentials,
        status: 201,
        haveProperties: ['authToken', 'index'],
        send: {},
      }
    );

    if (!options.parameters) {
      options.credentials = {
        username: options.username ?? options.credentials?.username,
        password: options.password ?? options.credentials?.password,
      };

      options.parameters = options.credentials;
    }

    rt.testEndPoint(options);
  },

  /**
   * Perform an automatic login in the agent using the endpoint sending a post to the endpoint. This method uses @see rt.testLogin.
   * @param {*} options Options for @see rt.testLogin.
   * You can specify the agent or app method to override the rt.app or rt.agent values.
   * This method test the existence of the rt.headers?.Authorization value if the value does not exists perform a new login.
   */
  autoLogin(options) {
    if (rt.headers?.Authorization) {
      return;
    }

    if (options === true) {
      options = {};
    }
            
    options = {
      headers: { Authorization: null },
      after: res => rt.headers.Authorization = `Bearer ${res.body.authToken}`,
      overrideIncludesEndpointCheck: true,
      ...options,
    };
    if (!options.agent) {
      rt.getAgent(options.app);
    }

    rt.testLogin(options);
  },

  /**
   * Check the tests for the general behavior of an endponit. This method uses the @see rt.testEndPoint method several times.
   * @param {*} options options, see the example for detail.
   * 
   * Perform several checks for the endpoint:
   *  - Not allowed HTTP methods
   *  - POST create object with missing params
   *  - POST create object with the right params
   *  - GET objects
   *  - POST forbidden double creation of object
   *  - GET the created object
   *  - GET single object using query parameters
   *  - GET single object using URL parameters
   *  - GET objects using query parameters
   *  - GET objects using URL parameters
   *  - DELETE tests only if the DELETE method is not in the not allowed HTTP method list
   *  - DELETE object no query error
   *  - DELETE error in UUID parameter
   *  - DELETE delete the previously created object by query
   *  - DELETE trying to delete a second time the same record must return an error
   *  - GET trying to get the deleted object
   *  - POST should create a new object again
   *  - GET should get the recently create objects
   *  - PATCH updates the created objets
   *  - DELETE delete the previously created object by path
   * 
   * @example
   *  {
   *      url: '/user',                                       // URL of the endpoint to check, @see rt.testEndPoint.
   *      notAllowedMethods: 'PUT,PATCH',                     // Not allowed method, @see rt.testEndPoint.
   *      parameters: {                                       // Parameters, @see rt.testEndPoint.
   *          username: 'test1',
   *          displayName: 'Test 1',
   *          password: 'abc123',
   *      },
   *      missingParameters: [                                // Test for missing parameters, @see rt.testEndPoint.
   *          ['username'],
   *          ['displayName'],
   *          ['username', 'displayName'],
   *      ],
   *      id: 'uuid'                                                                      // name for the object id by default is uuid
   *      forbiddenDoubleCreation: true,                                                  // Test for forbidden double creation of the same object
   *      getProperties: ['uuid', 'isEnabled', 'username', 'displayName', 'UserType'],    // Properties to check the GET method.
   *      getCreated: {query:{username:'test1'}},                                         // Options to get the created object to perform the rest of the tests.
   *      getByQuery: [                                                                   // Test to get objects using the query params, each item is a separated test
   *          'username', string|CSV|array                                                // Use the values listed in parameters to get objects
   *          'uuid'
   *      ],
   *      getSingleByQuery: [                                                             // Same as above but check single result
   *          'username',
   *          'uuid'
   *      ],
   *      getByUrl: ['uuid'],                                                             // Same as above the form used is URL/name1/value1/name2/value2, when a test with the id parameter as the only parameter the form URL/idValue is used.
   *      getSingleByUrl: ['uuid'],                                                       // Same as above but check single result
   *      patchParameters: [                                                              // Test the HTTP patch method for each element in the list.
   *          {
   *              name1: value1,
   *              name2, value2
   *          },
   *      ]
   *  }
   */
  testGeneralBehaviorEndPoint(options) {
    if (options.checkItem === undefined) {
      options.checkItem = true;
    }

    describe('General behavior', () => {
      rt.testEndPoint({
        url: options.url,
        notAllowedMethods: options.notAllowedMethods,
        send: [
          {
            title: 'POST should not create a new object',
            method: 'post',
            parameters: options.parameters,
            missingParameters: options.missingParameters,
          },
          {
            title: 'POST should create a new object',
            method: 'post',
            parameters: options.parameters,
          },
          {
            title: 'GET should get a objects list',
            checkItem: options.checkItem,
            haveProperties: options.getProperties,
          },
        ]
      });

      if (options.forbiddenDoubleCreation) {
        rt.testEndPoint({
          url: options.url,
          title: 'POST should not create the same object again',
          method: 'post',
          parameters: options.parameters,
          status: '409,!2xx,!4xx',
          haveProperties: 'error,message'
        });
      }

      let createdObject;
      if (options.getCreated) {
        rt.testEndPoint({
          url: options.url,
          checkItem: options.checkItem,
          haveProperties: options.getProperties,
          get: {
            title: 'GET should get the recently create objects',
            query: options.getCreated.query,
            checkItem: options.checkItem,
            after: (res, val) => createdObject = val,
          },
        });
      }

      if (!options.id) {
        options.id = 'uuid';
      }

      const gets = {
        getByQuery: { inQuery: true }, 
        getSingleByQuery: { inQuery: true, single: true }, 
        getByUrl: { inUrl: true }, 
        getSingleByUrl: { inUrl: true, single: true }, 
      };

      for (const getName in gets) {
        if (!options[getName]) {
          continue;
        }

        if (!options.getCreated) {
          throw new Error(`cannot test ${getName} because no getCreated is defined.`);
        }

        const getOptions = gets[getName];
        const sendOptions = {
          url: options.url,
          checkItem: options.checkItem,
          haveProperties: options.getProperties,
          get: {
            checkItem: options.checkItem,
            query: {},
          },
        };

        let getByPropertiesList = options[getName];
        if (!Array.isArray(getByPropertiesList)) {
          getByPropertiesList = [getByPropertiesList];
        }

        for (let i in getByPropertiesList)  {
          let properties = getByPropertiesList[i];
          if (!Array.isArray(properties)) {
            properties = [properties];
          }

          const query = {};
          for (const i in properties) {
            query[properties[i]] = '';
          }

          if (!sendOptions.get.method) {
            sendOptions.get.method = 'get';
          }

          if (getOptions.inQuery) {
            sendOptions.get.title = `${sendOptions.get.method.toUpperCase()} should get a single object by ${properties.join(', ')} in query`;
            sendOptions.get.before = test => {
              for (const k in query) {
                test.query[k] = createdObject[k];
              }
            };
          }

          if (getOptions.inUrl) {
            sendOptions.get.title = `${sendOptions.get.method.toUpperCase()} should get a single object by ${properties.join(', ')} in URL`;
            sendOptions.get.before = test => {
              if (properties.length === 1 && properties[0] === options.id) {
                test.url += '/' + createdObject[options.id];
              } else {
                for (const k in query) {
                  test.url += '/' + k + '/' + createdObject[k];
                }
              }
            };
          }

          /*if (getOptions.single) {
            sendOptions.get.rowsLengthOf = 1;
          } else if (sendOptions.get.rowsLengthOf !== undefined) {
            delete sendOptions.get.rowsLengthOf;
          }*/

          rt.testEndPoint(sendOptions);
        }
      }

      let isDeleteMethodNotAllowed;
      if (!options.notAllowedMethods) {
        isDeleteMethodNotAllowed = false;
      } else if (typeof options.notAllowedMethods === 'string') {
        isDeleteMethodNotAllowed = options.notAllowedMethods.toUpperCase().indexOf('DELETE') >= 0;
      } else if (Array.isArray(options.notAllowedMethods)) {
        options.notAllowedMethods.forEach(method => {
          if (method.toUpperCase() === 'DELETE') {
            isDeleteMethodNotAllowed = true;
          }
        });
      } else {
        throw new Error('notAllowedMethods option is not a string or Array');
      }

      if (options.patchParameters) {
        if (!options.getCreated) {
          throw new Error('cannot test PATCH because no getCreated is defined.');
        }
                    
        let patchParameters = options.patchParameters;
        if (!Array.isArray(patchParameters)) {
          patchParameters = [patchParameters];
        }
                
        for (const i in patchParameters) {
          rt.testEndPoint({
            url: options.url,
            patch: {
              title: 'PATCH change data for object',
              parameters: patchParameters[i],
              before: test => test.url += '/' + createdObject[options.id],
            },
          });

          rt.testEndPoint({
            url: options.url,
            get: {
              title: 'GET changed data object',
              before: test => test.url += '/' + createdObject[options.id],
              lengthOfContainer: 1,
              checkItem: true,
              haveProperties: patchParameters[i],
            },
          });
        }
      }

      if (!isDeleteMethodNotAllowed) {
        if (!options.getCreated) {
          throw new Error('cannot test DELETE because no getCreated is defined.');
        }

        if (!options.deleteQuery) {
          options.deleteQuery = {};
          options.deleteQuery[options.id] = '';
        }
                
        if (!options.deleteMissingQuery) {
          options.deleteMissingQuery = options.id;
        }

        rt.testEndPoint({
          url: options.url,
          delete: {
            query: options.deleteQuery,
            send: [
              'noQueryError',
              { missingQuery: options.deleteMissingQuery },
              {
                title: 'DELETE error in UUID parameter must return an error',
                before: test => test.query[options.id] = 'Invalid ID',
                status: 400,
                haveProperties: 'error,message',
              },
              {
                title: 'DELETE delete the previously created object by query',
                before: test => test.query[options.id] = createdObject[options.id],
              },
              {
                title: 'DELETE trying to delete a second time the same record must return an error',
                before: test => test.query[options.id] = createdObject[options.id],
                status: 404,
                haveProperties: 'error,message',
              },
              {
                title: 'GET trying to get the deleted object',
                method: 'get',
                before: test => test.query[options.id] = createdObject[options.id],
                lengthOfContainer: 0,
              },
            ],
          },
        });

        rt.testEndPoint({
          url: options.url,
          send: [
            {
              title: 'POST should create a new object again',
              method: 'post',
              parameters: options.parameters,
            },
            {
              title: 'GET should get the recently create objects',
              query: options.getCreated.query,
              checkItem: true,
              haveProperties: options.getProperties,
              after: (res, val) => createdObject = val,
            },
            {
              title: 'DELETE delete the previously created object by path',
              method: 'delete',
              before: test => test.url += '/' + createdObject[options.id],
            },
          ],
        });
      }
    });
  },
};
