const cors = require('cors');
const express = require('express');
const config = require('config');
const debug = require('debug')('app:startup');
const auth = require('./routes/auth');
const reports = require('./routes/reports');
const users = require('./routes/users');

const app = express();
const port = process.env.PORT || 3000;

if (!config.get('jwtPrivateKey')) {
  debug('FATAL ERROR: jwtPrivateKey is not defined.');
  process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use('/api/auth', auth);
app.use('/api/reports', reports);
app.use('/api/users', users);

app.listen(port, () => {
  debug(`Listening on port: ${port}`);
});
