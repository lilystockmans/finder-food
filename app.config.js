const base = require('./app.json');

module.exports = {
  ...base.expo,
  extra: {
    geminiKey: process.env.FF_GEMINI_KEY ?? '',
    eas: {
      projectId: 'e306cd91-f8a0-4454-b6f8-6fd758435ca1',
    },
  },
};
