// We pick a simple version for PROD, or an HMR enabled version for DEV.
if (process.env.NODE_ENV === 'production') {
  module.exports = require('./configureStore.prod');
} else {
  module.exports = require('./configureStore.dev');
}
