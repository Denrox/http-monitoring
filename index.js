const {readFileSync} = require('fs');
const superagent = require('superagent');
const configSchema = require('./schema/config.schema');

const fetchResource = async (resource) => {
  const p = new Promise((resolve, reject) => {
    const handleResponse = (err, res) => {
      const rawRes= err ? err.response : res;
      if (rawRes) {
        if (resource.expect) {
          if (resource.expect.status && rawRes.statusCode !== resource.expect.status) {
            reject(`Status code does not match for ${resource.url}, expected ${resource.expect.status} but got ${rawRes.statusCode}`);
          } else if (resource.expect.headers) {
            const headers = resource.expect.headers;
            const headerNames = Object.keys(resource.expect.headers);
            for (let i = 0; i < headerNames.length; i++) {
              const headerName = headerNames[i];
              const checkHeaderName = headerName.toLowerCase();
              const expectedValue = headers[headerName];

              if (rawRes.header[checkHeaderName] !== expectedValue) {
                const actualHeader = rawRes.header[checkHeaderName];
                reject(`Header "${headerName}" does not match for ${resource.url}, expected ${expectedValue} but got ${actualHeader}`);
              }
            }
            resolve(`Fetched ${resource.url} with status code ${rawRes.statusCode}`);
          } else if (resource.expect.body && rawRes.text !== resource.expect.body) {
            reject(`Body does not match for ${resource.url}, expected ${resource.expect.body} but got ${rawRes.text}`);
          } else {
            resolve(`Fetched ${resource.url} with status code ${rawRes.statusCode}`);
          }
        } else {
          resolve(`Fetched ${resource.url} with status code ${rawRes.statusCode}`);
        }
      } else {
        reject(`Failed to fetch ${resource.url}`);
      }
    };
    if (resource.method === 'POST' || resource.method === 'PUT' || resource.method === 'PATCH' || resource.method === 'DELETE') {
      const method = resource.method.toLowerCase();
      superagent[method](resource.url)
          .send(resource.body)
          .redirects(resource.redirects || 0)
          .end(handleResponse);
    } else if (resource.method === 'GET') {
      superagent
          .get(resource.url)
          .redirects(resource.redirects || 0)
          .end(handleResponse);
    }
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
    try {
      await configSchema.validate(config, {strict: true});
      const resources = config.resources;
      let message = '';
      for (let i = 0; i < resources.length; i++) {
        const resource = resources[i];
        try {
          const r = await fetchResource(resource);
          message += r + ' \u2705' + '\n';
        } catch (e) {
          message += e + ' \u2717' + '\n';
        }
      };
      console.log(message);
      if (config.telegramKey && config.chatId && message) {
        try {
          const telegramKey = config.telegramKey;
          const chatId = config.chatId;
          const formattedMessage = message.replace(/\u2705/g, '✅').replace(/\u2717/g, '❌');

          const url = `https://api.telegram.org/bot${telegramKey}/sendMessage?chat_id=${chatId}`;
          superagent
              .post(url)
              .send({text: formattedMessage})
              .end((err) => {
                if (err) {
                  console.error('Failed to send message to telegram');
                }
              });
        } catch (e) {
          console.error('Failed to send message to telegram');
        }
      }
    } catch (e) {
      console.error(e.message);
    }
  } catch (e) {
    throw new Error('Config file is invalid');
  }
})();
