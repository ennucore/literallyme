'use strict';

const app = require('./app');

const PORT = parseInt(process.env.PORT) || 8080;

const main = async () => {
  app.listen(PORT);
};

main();