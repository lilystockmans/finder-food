const base = require('./app.json');

module.exports = {
  ...base.expo,
  extra: {
    geminiKey: process.env.FF_GEMINI_KEY ?? '',
  },
};
