const chai = require('chai');
const ru = require('rofa-util');

chai.use(require('chai-http'));
const expect = chai.expect;

const rt = {
    app: null,
    agent: null, 
    headers: {},

    createAgent(app) {
        return chai.request.agent(app ?? rt.app);
    },

    initAgent(app) {
        rt.agent = rt.createAgent(app);

        return rt.agent;
    },

    getAgent(app) {
        if (app || !rt.agent)
            rt.initAgent(app);

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
     *              status: 200,
     *              haveProperties = 'error',
     *              query: '$form',
     *              title: 'should get a form usign $form query parameter',
     *          }
     *          noParametersError:      test the endpoint for an error on get method without parameters
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
     *   notAllowedMethods: 'PUT,PATCH,DELETE,OPTIONS,HEAD',        // not allowed methods for this endpoint
     *   get: [                                                     // test for GET HTTP method using array
     *       'noParametersError',                                   // test for no parameters expect error
     *       {                                                      // begin test definition for get form
     *           $form: true,                                       // test for get form using the $form as query parameter '/api/login?$form'
     *           haveProperties: ['username', 'password']           // check for the result exists the properties username andpassword
     *       },
     *   ],
     *   post: {                                                    // test for POST HTTP method using object
     *       parameters: {                                          // default parameters options for the rest of tests
     *           username: 'admin',
     *           password: '1234'
     *       },
     *       send: [                                                // test definitions
     *           'noParametersError',                               // test for no parameters expect error (same as above)
     *           {                                                  // begin test definition for missingParameters
     *               missingParameters: [                       
     *                   ['username', 'password'],                  // test for no parameters body = {}
     *                   ['username'],                              // test for no parameters username
     *                   ['password']                               // test for no parameters password
     *               ]
     *           },
     *           {                                                  // begin custom test item for Invalid credentials
     *               title: '"Invalid credentials" login error',    // test title
     *               parameters: {                                  // override parameters for introduce an error
     *                   username: 'admin',
     *                   password: '12345'
     *               },
     *               status: 403,                                   // expected status
     *               haveProperties: 'error',                       // expected property error in the result
     *               propertyContains: {                            // expected message 'Invalid credentials' in the property message in the result
     *                   message: 'Invalid credentials'
     *               }
     *           },
     *           {                                                                              // begin custom test item for login
     *               title: 'login should returns a valid session authToken',
     *               status: 201,                                                               // expected status
     *               haveProperties: ['authToken', 'index'],                                    // expected properties in the result
     *               after: res => headers.Authorization = `Bearer ${res.body.authToken}`,      // after succesfull test, store the authToken for reuse as authorization header
     *           },
     *           {
     *               title: 'should returns a distinct valid session authToken',                // begin custom test item for another login a distinct authToken is espected
     *               status: 201,
     *               haveProperties: ['authToken', 'index'],
     *               after: res => expect(headers.Authorization).to.be.not.equals(`Bearer ${res.body.authToken}`),    // after succesfull test, use a custom check to verify the authToken
     *           },
     *       ]
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
                if (!['notAllowedMethods', 'send', 'get', 'post', 'put', 'patch', 'options', 'delete'].includes(k))
                    defaultOptions[k] = options[k];
            }

            if (options.notAllowedMethods) {
                let notAllowedMethods = options.notAllowedMethods;
                if (typeof notAllowedMethods === 'string')
                    notAllowedMethods = notAllowedMethods.split(/[,;]/);

                if (notAllowedMethods instanceof Array) {
                    let notAllowedMethodsOptions = {};
                    for (const i in notAllowedMethods) {
                        let method = notAllowedMethods[i].trim();
                        if (method[0] == '!')
                            notAllowedMethodsOptions[method.substring(1)] = false;
                        else
                            notAllowedMethodsOptions[method] = true;
                    }
    
                    notAllowedMethods = notAllowedMethodsOptions;
                }

                for (const notAllowedMethod in notAllowedMethods) {
                    const testOptions = notAllowedMethods[notAllowedMethod];
                    const test = {};
                    if (!testOptions)
                        test.skip = true;
                    else if (typeof testOptions === 'object')
                        for (const k in testOptions)
                            test[k] = testOptions[k];

                    if (test.status === undefined)
                        test.status = 405;

                    if (test.method === undefined)
                        test.method = notAllowedMethod.trim().toLowerCase();
    
                    if (test.json === undefined && test.haveProperties === undefined && test.empty === undefined) {
                        if (test.method === 'head')
                            test.empty = true;
                        else
                            test.haveProperties = ['error'];
                    }

                    for (const k in defaultOptions)
                        if (test[k] === undefined)
                            test[k] = defaultOptions[k];

                    if (test.title === undefined)
                        test.title = `${test.method.toUpperCase()} HTTP method not allowed`;

                    tests.push(test);
                }
            }

            for (const method in {send: true, get: true, post: true, put: true, patch: true, delete: true, options: true, head: true}) {
                let methodOptions = options[method];
                if (methodOptions === undefined)
                    continue;

                if (methodOptions instanceof Array)
                    methodOptions = {send: methodOptions};
                else if (methodOptions === false)
                    methodOptions = {skip: true};
                else if (typeof methodOptions !== 'object')
                    methodOptions = {};

                if (methodOptions.send === undefined)
                    methodOptions.send = [{}];

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

                    if (test.method === undefined)
                        if (method !== 'send')
                            test.method = method;
                        else if (defaultOptions.method)
                            test.method = defaultOptions.method;
                        else
                            test.method = 'get';
    
                    for (const k in methodOptions)
                        if (test[k] === undefined && k !== 'send')
                            test[k] = methodOptions[k];

                    for (const k in defaultOptions)
                        if (test[k] === undefined)
                            test[k] = defaultOptions[k];

                    if (test.missingParameters !== undefined) {
                        if (!test.parameters)
                            throw new Error ('trying to define a missing parametes test withut parameters.');

                        if (!test.missingParameters)
                            test.skip = true;
                        
                        const missingParameters = test.missingParameters;
                        delete test.missingParameters;
                        for (const i in missingParameters) {
                            const thisTest = {parameters: {}};
                            for (const k in test)
                                if (k !== 'parameters')
                                    thisTest[k] = test[k];

                            const thisMissingParameters = missingParameters[i];

                            for (const k in test.parameters)
                                if (!thisMissingParameters.includes(k))
                                    thisTest.parameters[k] = test.parameters[k];

                            if (!thisTest.title)
                                thisTest.title = `should get a missing parameter error for parameters: ${thisMissingParameters.join(', ')}`;
                            
                            if (thisTest.status === undefined)
                                thisTest.status = 400;

                            if (thisTest.haveProperties === undefined)
                                thisTest.haveProperties = 'error';

                            if (thisTest.propertyContains === undefined)
                                thisTest.propertyContains = {missingParameters: thisMissingParameters};

                            tests.push(thisTest);
                        }

                        continue;
                    }

                    tests.push(test);
                }
            }
        }

        const helpers = {
            noParametersError: {
                status: 400,
                haveProperties: 'error',
                title: 'should get a no parameters error',
            }, 
            $form: {
                status: 200,
                haveProperties: 'error',
                query: '$form',
                title: 'should get a form usign $form query parameter',
            }
        };
        for (const i in tests) {
            const test = tests[i];
            for (const helper in helpers) {
                if (test[helper] !== undefined) {
                    if (typeof test[helper] === 'object')
                        for (const k in test[helper])
                            test[k] = test[helper][k];
                    else if (!test[helper])
                        test.skip = false;

                    const defaultData = helpers[helper];
                    for (const k in defaultData)
                        if (test[k] === undefined)
                            test[k] = defaultData[k];

                    if (helper === 'noParametersError')
                        delete test.parameters;

                    delete test[helper];
                }
            }

            tests[i] = test;
        }

        for (const i in tests)
            rt.testEndPointMethodSend(tests[i]);
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
     *  [checkOptions]                  options for checking the response @see rt.checkReponse for detail.
     * }
     */
    testEndPointMethodSend(test) {
        if (test.test === undefined)
            if (test.only)
                test.test = it.only;
            else if (test.skip)
                test.test = it.skip;
            else
                test.test = it;

        if (!test.title)
            if (test.status)
                test.title = `${test.url} ${test.method} should return a ${test.status} HTTP status code`;
            else
                test.title = `${test.url} ${test.method}`;
            
        if (!test.method)
            test.method = 'get';

        if (test.requestLog) {
            let requestLog = test.requestLog;
            if (typeof requestLog === 'string')
                requestLog = requestLog.split(',');

            if (requestLog instanceof Array) {
                const message = {};
                if (requestLog.includes('headers'))
                    message.headers = test.headers;
                
                console.requestLog(message);
            }
        }

        test.test(test.title, done => {
            if (!test.agent) {
                test.agent = rt.agent;

                if (!test.agent && rt.app)
                    test.agent = chai.request(rt.app);
            }
            
            if (test.base === undefined)
                test.base = rt.base;

            if (test.headers === undefined)
                test.headers = rt.headers;

            if (!test.headers)
                test.headers = {};
                
            if (test.before)
                test.before(test);

            if (test.requestLog) {
                let requestLog = test.requestLog;
                if (typeof requestLog === 'string')
                    requestLog = requestLog.split(',');
    
                if (requestLog instanceof Array) {
                    const message = {};
                    if (requestLog.includes('headers'))
                        message.headers = test.headers;
                    
                    console.requestLog(message);
                }
            }

            test.agent[test.method]((test.base ?? '') + test.url)
                .query(test.query)
                .set(test.headers)
                .send(test.parameters)
                .end((_, res) => {
                    if (test.check)
                        test.check(res, test);
                    else
                        rt.checkReponse(res, test);
                    done();
                });
        });
    },

    /**
     * Check the response for given options
     * @param {*} res response
     * @param {*} options options to check the response. Valid options are:
     *  {
     *      status: 200,                    check the status code if exists except if is undefined or false.
     *      haveCookies: cookies            check the headers response for the given cookies to exists. This option can be a string for a single cookie, a list for multiple cookies, or a object in this case check the cookies value.
     *      noHaveCookies: cookies          check the headers response for the given cookies to not exists. This option can be a string for a single cookie, a list for multiple cookies, or a object in this case check the cookies to be distinct value.
     *      empty: true,                    check the response body to be empty.
     *      json: true,                     check the response body to be a JSON. If this option is not specified but haveProperties or noHaveProperties it is this option will be set to true.
     *      haveProperties: properties,     check the response body for the given properties to exist. This option can be a string for a single property, a list for multiple properties, or a object in this case check the properties value.
     *      noHaveProperties: properties,   check the response body for the given properties to not exist. This option can be a string for a single property, a list for multiple properties, or a object in this case check the properties to be distinct value.
     *      propertyContains: {             check the response body to have a property and its value contains the given values.
     *          propertyName: ['one', 'two']
     *      },
     *      after: method                   call the method with response has parameter.
     *      log: true|string|list           show a console.log of listed items from response. It this is true uses: [status, body]
     *  }
     */
    checkReponse(res, options) {
        if (options.log) {
            let log = options.log;
            if (log === true)
                log = ['status', 'body'];
            else if (typeof log === 'string')
                log = log.split(',');

            const message = {};
            for (const i in log) {
                const k = log[i];
                message[k] = res[k];
            }

            console.log(message);
        }

        if (options.status != undefined && options.status !== false)
            expect(res).to.have.status(options.status);

        if (options.haveCookies) {
            let haveCookies = options.haveCookies;
            if (typeof haveCookies === 'string')
                haveCookies = [haveCookies];

            if (haveCookies instanceof Array) {
                for (const i in haveCookies)
                    expect(res).to.have.cookie(haveCookies[i]);
            } else if (typeof haveCookies === 'object') {
                for (const cookie in haveCookies)
                    expect(res).to.have.cookie(cookie, haveCookies[cookie]);
            } else
                throw new Error('error to check cookies values. haveCookies option must be a string for a single cookie, a list or a object');
        }

        if (options.noHaveCookies) {
            let noHaveCookies = options.noHaveCookies;
            if (typeof noHaveCookies === 'string')
                noHaveCookies = [noHaveCookies];

            if (noHaveCookies instanceof Array) {
                for (const i in noHaveCookies)
                    expect(res).to.not.have.cookie(noHaveCookies[i]);
            } else if (typeof noHaveCookies === 'object') {
                for (const cookie in noHaveCookies)
                    expect(res).to.not.have.cookie(cookie, noHaveCookies[cookie]);
            } else
                throw new Error('error to check cookies values. noHaveCookies option must be a string for a single cookie, a list or a object');
        }

        if (options.empty)
            expect(res.text).to.be.empty;

        if (options.haveProperties || options.noHaveProperties)
            if (options.json === undefined)
                options.json = true;

        if (options.json)
            expect(res).to.be.json;

        if (options.haveProperties) {
            let haveProperties = options.haveProperties;
            if (typeof haveProperties === 'string')
                haveProperties = [haveProperties];

            if (haveProperties instanceof Array) {
                for (const i in haveProperties)
                    expect(res.body).to.have.property(haveProperties[i]);
            } else if (typeof haveProperties === 'object') {
                for (const cookie in haveProperties)
                    expect(res.body).to.have.property(cookie, haveProperties[cookie]);
            } else
                throw new Error('error to check body result values. haveProperties option must be a string for a single property, a list or a object');
        }

        if (options.noHaveProperties) {
            let noHaveProperties = options.noHaveProperties;
            if (typeof noHaveProperties === 'string')
                noHaveProperties = [noHaveProperties];

            if (noHaveProperties instanceof Array) {
                for (const i in noHaveProperties)
                    expect(res.body).to.not.have.property(noHaveProperties[i]);
            } else if (typeof noHaveProperties === 'object') {
                for (const property in noHaveProperties)
                    expect(res.body).to.not.have.property(property, noHaveProperties[property]);
            } else
                throw new Error('error to check body result  values. noHaveProperties option must be a string for a single property, a list or a object');
        }

        if (options.propertyContains) {
            for (const property in options.propertyContains) {
                const properties = expect(res.body).to.have.property(property);
                const contains = options.propertyContains[property];
                if (contains instanceof Array)
                    for (const i in contains)
                        properties.contains(contains[i]);
                else
                    properties.contains(contains);
            }
        }

        if (options.after)
            options.after(res);
    },

    /**
     * Perform a HTTP not allowed method testa on an end point expect errors. This method uses the @see rt.testEndPoint with get: {noParametersError: true} options.
     * @param {*} options options for the method @see rt.testEndPoint method.
     * @param  {...srting} notAllowedMethods method names to check not alloed.
     * @returns 
     */
    testNotAllowedMethod(options, ...notAllowedMethods) {
        options = ru.deepMerge(options, {notAllowedMethods});

        rt.testEndPoint(options);
    },

    /**
     * Perform a get test on an end point for no parameters and expect an error. This method uses the @see rt.testEndPoint with get: {noParametersError: true} options.
     * @param {*} options options for the method @see rt.testEndPoint method.
     */
    testGetNoParametesError(options) {
        options = ru.deepMerge(options, {get: {noParametersError: true}});

        rt.testEndPoint(options);
    },

    /**
     * Perform a test on an end point to get the form using the $form query get parameter. This method uses the @see rt.testEndPoint with get: {$form: {haveProperties: haveProperties}} options.
     * @param {*} options options for the method @see rt.testEndPoint method.
     * @param  {...string} haveProperties properties names to check in the result.
     */
    testGetForm(options, ...haveProperties) {
        options = ru.deepMerge(
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
        options = ru.merge(
            options,
            {
                title: 'login should returns a valid session authToken',
                url: '/login',
                method: 'post',
                credentials: rt.credentials,
                status: 201,
                haveProperties: ['authToken', 'index'],
                send: {},
            }
        );

        if (!options.parameters) {
            options.credentials = ru.merge(
                options.credentials,
                {
                    username: options.username,
                    password: options.password,
                }
            );

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
        if (rt.headers?.Authorization)
            return;
            
        options = ru.merge(options, {after: res => rt.headers.Authorization = `Bearer ${res.body.authToken}`});

        rt.getAgent(options.app);
        rt.testLogin(options);
    }
};

module.exports = rt;