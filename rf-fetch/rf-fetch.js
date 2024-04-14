export async function rfFetch(conf, options) {
  let service;
  if (conf.serviceName) {
    service = conf.services[conf.serviceName];
  } else {
    service = conf.service;
  }

  if (!service) {
    service = conf;
  }

  let url = conf.baseUrl + service.url;
  const fetchOptions = { ...service.fetchOptions };
  if (typeof fetchOptions.body === 'object') {
    fetchOptions.body = JSON.stringify(fetchOptions.body);

    fetchOptions.headers ??= {};
    fetchOptions.headers['Content-Type'] ??= 'application/json';
  }

  if (options?.headers) {
    fetchOptions.headers = { ...fetchOptions?.headers, ...options.headers };
  }

  if (options?.query) {
    fetchOptions.query = { ...fetchOptions?.query, ...options.query };
  }

  if (fetchOptions?.urlParam) {
    fetchOptions.urlParams ??= [];
    fetchOptions.urlParams.push(fetchOptions.urlParam);
  }

  if (options?.urlParam) {
    fetchOptions.urlParams ??= [];
    fetchOptions.urlParams.push(options.urlParam);
  }

  if (options?.urlParams) {
    fetchOptions.urlParams ??= [];
    fetchOptions.urlParams.push(...options.urlParams);
  }

  if (fetchOptions.urlParams) {
    if (!url.endsWith('/')) {
      url += '/';
    }

    url += fetchOptions.urlParams.join('/');
  }

  if (fetchOptions.query) {
    url += '?' + new URLSearchParams(fetchOptions.query);
  }

  const log = options?.log ?? conf?.log ?? options.defaultLog ?? conf?.defaultLog;
  if (log?.info) {
    log.info('Fetching ' + url);
  }

  const res = await fetch(url, fetchOptions);

  if (log?.info) {
    log.info('Response status ' + res.status + ' from ' + url);
  }

  if (!res.ok) {
    throw new Error('Response is not OK, status: ' + res.status);
  }

  return res;
}

export async function rfFetchJson(service, options) {
  const res = await rfFetch(service, options);
  const data = await res.json();
  if (!data) {
    throw new Error('Response is not a JSON.');
  }

  return data;
}
