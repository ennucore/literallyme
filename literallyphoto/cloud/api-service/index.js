`use strict`;

const express = require('express');
const { ExecutionsClient } = require('@google-cloud/workflows');
const { firestore } = require('./firebase');
const { FieldValue } = require('@google-cloud/firestore');
const {
  hasBalanceForImageGeneration,
  hasBalanceForTraining,
} = require('./balance');

const TRAINING_WORKFLOW_NAME = 'workflow-training';
const IMAGE_GENERATION_WORKFLOW_NAME = 'workflow-image-generation';
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
    `Received request to start training userId ${userId} targetId ${targetId} archiveUrl ${archiveUrl}`,
  );
  const input = {
    userId: userId,
    targetId: targetId,
    archiveUrl: archiveUrl,
  };
  if (!(await hasBalanceForTraining(userId))) {
    console.log(`Insufficient balance for training userId ${userId}`);
    res.status(402).send('Insufficient balance for training');
    return;
  }
  console.log(`Training input: ${JSON.stringify(input)}`);
  await firestore
    .collection('trainings')
    .doc(userId)
    .collection('targets')
    .doc(targetId)
    .set({
      weightsUrl: '',
      callbacks: [],
      status: 'processing',
      created: FieldValue.serverTimestamp(),
    });
  const workflow = executionsClient.workflowPath(
    PROJECT_ID,
    'us-central1',
    TRAINING_WORKFLOW_NAME,
  );

  await executionsClient.createExecution({
    parent: workflow,
    execution: {
      argument: JSON.stringify(input),
    },
  });
  console.log(
    `Started training workflow for userId: ${userId} targetId: ${targetId}`,
  );
  res.status(200).json({ status: 'success' });
});

app.post(`/image_generation`, async (req, res) => {
  const { userId, targetId, imagePrompt } = req.body;
  console.log(
    `Received request to generate photos userId ${userId} targetId ${targetId} imagePrompt ${imagePrompt}`,
  );

  if (!(await hasBalanceForImageGeneration(userId))) {
    console.log(`Insufficient balance for generation userId ${userId}`);
    res.status(402).send('Insufficient balance for generation');
    return;
  }

  const weightsUrl = await getWeightsUrl(userId, targetId);

  if (weightsUrl === '') {
    console.log(`Weights not found for userId ${userId} targetId ${targetId}`);
    res.status(402).send('Weights not found');
    return;
  }
  console.log(`Retrieved weightsUrl: ${weightsUrl}`);

  try {
    const generationsDocRef = firestore
      .collection('image_generations')
      .doc(userId)
      .collection('targets')
      .doc(targetId);

    const newGeneration = await generationsDocRef
      .collection('generations')
      .add({
        images: [],
        image_prompt: imagePrompt,
        status: 'processing',
        created: FieldValue.serverTimestamp(),
      });

    const generationId = newGeneration.id;
    const docName = `image_generations/${userId}/targets/${targetId}/generations/${generationId}`;
    const input = {
      userId: userId,
      targetId: targetId,
      imagePrompt: imagePrompt,
      weightsUrl: weightsUrl,
      generationId: generationId,
      docName: docName,
    };

    console.log(`Image generation input: ${JSON.stringify(input)}`);
    const workflow = executionsClient.workflowPath(
      PROJECT_ID,
      'us-central1',
      IMAGE_GENERATION_WORKFLOW_NAME,
    );

    await executionsClient.createExecution({
      parent: workflow,
      execution: {
        argument: JSON.stringify(input),
      },
    });

    console.log(
      `Started image generation workflow for userId: ${userId} targetId: ${targetId} imagePrompt: ${imagePrompt}`,
    );

    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

async function getWeightsUrl(userId, targetId) {
  const weightsDocRef = firestore
    .collection('trainings')
    .doc(userId)
    .collection('targets')
    .doc(targetId);
  const weightsDoc = await weightsDocRef.get();
  let weightsUrl = '';
  if (weightsDoc.exists) {
    if (weightsDoc.data().weightsUrl !== '') {
      weightsUrl = weightsDoc.data().weightsUrl;
    }
  }
  return weightsUrl;
}
