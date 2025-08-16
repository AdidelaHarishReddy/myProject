const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://65.0.20.95:8000',
      changeOrigin: true,
      timeout: 30000, // 30 second timeout
      proxyTimeout: 30000,
    })
  );
};
