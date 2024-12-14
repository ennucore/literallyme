`use strict`;

const express = require('express');
const { ExecutionsClient } = require('@google-cloud/workflows');
// const { firestore } = require('./firebase');

const TRAINING_WORKFLOW_NAME = 'workflow-training';
const PROJECT_ID = 'literallyme-dev';
const PORT = parseInt(process.env.PORT) || 8080;

const executionsClient = new ExecutionsClient();

const app = express();
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
app.use(express.raw({ type: 'application/zip', limit: '1Gb' }));
app.use(express.json());

// TODO: Add auth
app.post(`/start_training`, async (req, res) => {
  const { userId, targetId, archiveUrl } = req.body;
  console.log(
    `Received request to start training userId ${userId} targetId ${targetId} archiveUrl ${archiveUrl}`
  );
  // TODO: Add checking for sufficient balance
  const input = {
    userId: userId,
    archiveUrl: archiveUrl,
  };
  console.log(`Training input: ${JSON.stringify(input)}`);
  // TODO: Add writing to DB
  // await firestore.collection('trainings').doc(userId).collection('targets').doc(targetId).set({
  //   weightsUrl: '',
  //   callbacks: [],
  //   status: 'processing',
  // });
  const workflow = executionsClient.workflowPath(PROJECT_ID, 'us-central1', TRAINING_WORKFLOW_NAME);

  const executionResponse = await executionsClient.createExecution({
    parent: workflow,
    execution: {
      argument: JSON.stringify(input),
    },
  });
  console.log(executionResponse);
  res.status(200).json({ status: 'success' });
});

app.post(`/generate_photos`, async (req, res) => {
  pass;
});
