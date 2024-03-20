const { readFileSync } = require('fs');
const superagent = require('superagent');

const fetchResource = async (resource) => {
  const p = new Promise((resolve, reject) => {
    const handleResponse = (err, res) => {
      const rawRes= err ? err.response : res;
        if (resource.expect) {
          if (resource.expect.status && rawRes.statusCode !== resource.expect.status) {
            reject(`Status code does not match for ${resource.url}, expected ${resource.expect.status} but got ${rawRes.statusCode}`);
          } else if (resource.expect.headers) {
            const headers = resource.expect.headers;
            for (let i = 0; i < headers.length; i++) {
              const header = headers[i];
              if (rawRes.header[header.name] !== header.value) {
                reject(`Header ${header.name} does not match for ${resource.url}, expected ${header.value} but got ${rawRes.header[header.name]}`);
              }
            }
            resolve(`Fetched ${resource.url} with status code ${rawRes.statusCode}`);
          } else {
            resolve(`Fetched ${resource.url} with status code ${rawRes.statusCode}`);
          }
        } else {
          resolve(`Fetched ${resource.url} with status code ${rawRes.statusCode}`);
        }
    };
    superagent
      .get(resource.url)
      .redirects(resource.redirects || 0)
      .end(handleResponse);
  });
  return p;
};

const args = process.argv.slice(2);
const agruments = {};
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--config')) {
    const config = args[i].split('=')[1];
    agruments.config = config;
  }
}

if (!agruments.config) {
  throw new Error('Config file is required');
}

const configContents = readFileSync(agruments.config, 'utf8');
(async () => {
  try {
    const config = JSON.parse(configContents);
    if (config.resources && config.resources.length && config.interval) {
      const interval = config.interval * 1000;
      const resources = config.resources;
      setInterval(async () => {
        let message = '';
        for (let i = 0; i < resources.length; i++) {
          const resource = resources[i];
          try {
            const r = await fetchResource(resource);
            message += r + '\n';
          } catch (e) {
            message += e + '\n';
          }
        };
        console.log(message);
      }, interval);
    } else {
      throw new Error('Config file is invalid');
    }
  } catch (e) {
    throw new Error('Config file is invalid');
  }
})()