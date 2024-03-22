const yup = require('yup');

const configSchema = yup.object({
  chatID: yup.string(),
  telegramKey: yup.string(),
  resources: yup.array().of(
      yup.object({
        url: yup.string().required(),
        method: yup.string().required(),
        redirects: yup.number(),
        body: yup.string(),
        expect: yup.object({
          statusCode: yup.string(),
          body: yup.string(),
          headers: yup.object(),
        }).required(),
      }),
  ),
});

module.exports = configSchema;
