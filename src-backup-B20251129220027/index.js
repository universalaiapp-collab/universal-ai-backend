// src/index.js - plain JS server bootstrap (CommonJS)
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const orchRoutes = require('./routes/orch.routes');
const adminRoutes = require('./routes/admin.routes');

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/universal-ai';
const PORT = process.env.PORT || 5000;

async function main() {
  try {
    await mongoose.connect(MONGO);
    console.log('Mongo connected to', MONGO);
  } catch (err) {
    console.error('Failed to connect to Mongo (ok for local dev if absent):', err.message);
  }

  const app = express();
  app.use(bodyParser.json());

  // DEV auth stub:
  app.use((req, res, next) => {
    req.user = { id: 'shubh@example.com', tier: 'PAID', role: 'admin' };
    next();
  });

  app.use(orchRoutes);
  app.use(adminRoutes);

  app.listen(PORT, () => console.log('Listening on', PORT));
}
main();
