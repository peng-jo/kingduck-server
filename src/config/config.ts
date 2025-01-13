export const config =
  process.env.NODE_ENV === 'production'
    ? require('./application.prod.json')
    : require('./application.dev.json');
