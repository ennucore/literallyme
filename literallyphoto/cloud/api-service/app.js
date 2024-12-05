`use strict`;

const express = require('express');
const { ExecutionsClient } = require('@google-cloud/workflows');

const app = express();
app.use(express.raw({ type: 'application/zip', limit: '1Gb' }));
app.use(express.json());

// TODO: Set up Google Cloud for workflow execution
const client = new ExecutionsClient();

app.get(`/training`, async (req, res) => {
  pass;
});

app.post(`/generate_photos`, async (req, res) => {
  pass;
});
