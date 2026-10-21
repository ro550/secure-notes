// server/src/index.js
const config = require('./config'); // must load first (loads .env)
const app = require('./app');

app.listen(config.PORT, () => {
  console.log(`Server running on http://localhost:${config.PORT}`);
});