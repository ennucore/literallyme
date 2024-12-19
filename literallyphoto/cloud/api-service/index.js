`use strict`;

const express = require('express');
const { ExecutionsClient } = require('@google-cloud/workflows');
const { firestore } = require('./firebase');
const { FieldValue } = require('@google-cloud/firestore');
const { Storage } = require('@google-cloud/storage');
const crypto = require('crypto');
const {
  hasBalanceForImageGeneration,
  hasBalanceForTraining,
} = require('./balance');
const { authenticateUser } = require('./middleware');
const cors = require('cors');

const TRAINING_WORKFLOW_NAME = 'workflow-training';
const IMAGE_GENERATION_WORKFLOW_NAME = 'workflow-image-generation';
const PROJECT_ID = 'literallyme-dev';
const PORT = parseInt(process.env.PORT) || 8080;

const USER_PHOTOS_BUCKET_NAME = `gs://${PROJECT_ID}_user_photos`;
const USER_PHOTOS_ARCHIVE_NAME = 'user_photos.zip';
const authRoutes = require('./authRoutes');

const storage = new Storage();
const executionsClient = new ExecutionsClient();

const app = express();
app.use(cors());
app.use(authRoutes);
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
app.use(express.raw({ type: 'application/zip', limit: '1Gb' }));
app.use(express.json());

app.post(`/start_training`, authenticateUser, async (req, res) => {
  const userId = req.uid;
  const { targetId } = req.body;
  console.log(
    `Received request to start training userId ${userId} targetId ${targetId}`,
  );
  if (!(await hasBalanceForTraining(userId))) {
    console.log(`Insufficient balance for training userId ${userId}`);
    res.status(402).send('Insufficient balance for training');
    return;
  }
  const bucket = storage.bucket(USER_PHOTOS_BUCKET_NAME);
  const fileName = `${userId}/${targetId}/${USER_PHOTOS_ARCHIVE_NAME}`;
  const file = bucket.file(fileName);
  if (await file.exists()) {
    console.log(`Found photos for userId ${userId} targetId ${targetId}`);
  } else {
    console.log(`No photos found for userId ${userId} targetId ${targetId}`);
    res.status(404).send('No photos found');
    return;
  }
  const archiveUrl = file.cloudStorageURI;
  console.log(`Archive URL: ${archiveUrl}`);
  const trainingDocRef = firestore
    .collection('trainings')
    .doc(userId)
    .collection('targets')
    .doc(targetId);
  await trainingDocRef.set({
    weightsUrl: '',
    status: 'processing',
    created: FieldValue.serverTimestamp(),
  });
  const docName = `trainings/${userId}/targets/${targetId}`;
  console.log(`Created training doc for userId ${userId} targetId ${targetId}`);

  const input = {
    userId: userId,
    targetId: targetId,
    archiveUrl: archiveUrl,
    docName: docName,
  };
  console.log(`Training input: ${JSON.stringify(input)}`);
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

app.post(`/image_generation`, authenticateUser, async (req, res) => {
  const userId = req.uid;
  const { targetId, imagePrompt } = req.body;
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
    const targetDocRef = firestore
      .collection('image_generations')
      .doc(userId)
      .collection('targets')
      .doc(targetId);
    const targetDoc = await targetDocRef.get();
    if (!targetDoc.exists) {
      await targetDocRef.set({
        created: FieldValue.serverTimestamp(),
      });
      console.log(
        `Created target document for userId ${userId} targetId ${targetId}`,
      );
    }

    const newGeneration = await targetDocRef
      .collection('generations')
      .add({
        images: [],
        image_prompt: imagePrompt,
        status: 'processing',
        created: FieldValue.serverTimestamp(),
      });

    const generationId = newGeneration.id;
    const docName = `image_generations/${userId}/targets/${targetId}/generations/${generationId}`;
    console.log(`Created generation document for userId ${userId} targetId ${targetId} generationId ${generationId}`);
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

app.post('/upload_archive_url', authenticateUser, async (req, res) => {
  const userId = req.uid;
  let { targetName } = req.body;
  targetId = crypto.randomUUID();
  const url = await generateV4UploadSignedUrl(userId, targetId);
  console.log(`upload_archive_url ${url}}`);
  const userDocRef = firestore.collection('trainings').doc(userId);
  const userDoc = await userDocRef.get();
  if (!userDoc.exists) {
    console.log(`Creating a new parent document for user ${userId}`);
    await userDocRef.set({
      created: FieldValue.serverTimestamp(),
    });
  }
  await userDocRef.collection('targets').doc(targetId).set({
    weightsUrl: '',
    targetName,
    status: 'processing',
    created: FieldValue.serverTimestamp(),
  });
  console.log(`Created target ${targetId} for user ${userId}`);
  res.status(200).json({
    upload_url: url,
    target_id: targetId,
  });
});

app.get('/get_generations', authenticateUser, async (req, res) => {
  const userId = req.uid;
  console.log(`Retrieving generations for user ${userId}`);
  const targetsSnapshot = await firestore
    .collection('image_generations')
    .doc(userId)
    .collection('targets')
    .get();

  const results = [];

  // Iterate over each target document
  for (const targetDoc of targetsSnapshot.docs) {
    const targetId = targetDoc.id;
    console.log(`Retrieving generations for target ${targetId}`);
    const generationsSnapshot = await firestore
      .collection('image_generations')
      .doc(userId)
      .collection('targets')
      .doc(targetId)
      .collection('generations')
      .get();
    for (const generationDoc of generationsSnapshot.docs) {
      const generationId = generationDoc.id;
      const generationData = generationDoc.data();
      results.push({
        targetId,
        generationId,
        ...generationData,
      });
    }
  }
  console.log(`Retrieved generations for user ${userId}: ${results.length}`);
  res.status(200).json(results);
});

app.get('/get_targets', authenticateUser, async (req, res) => {
  const userId = req.uid;
  console.log(`Retrieving targets for user ${userId}`);
  const targets = await firestore
    .collection('trainings')
    .doc(userId)
    .collection('targets')
    .get();
  const data = [];
  for (const target of targets.docs) {
    data.push({
      targetId: target.id,
      ...target.data(),
    });
  }
  console.log(`Retrieved targets for user ${userId}: ${JSON.stringify(data)}`);
  res.status(200).json(data);
});

app.post('/generation_status', authenticateUser, async (req, res) => {
  pass;
});

app.post('/training_status', authenticateUser, async (req, res) => {
  pass;
});

async function generateV4UploadSignedUrl(userId, targetId) {
  const fileName = `${userId}/${targetId}/${USER_PHOTOS_ARCHIVE_NAME}`;
  const options = {
    version: 'v4',
    action: 'write',
    expires: Date.now() + 60 * 60 * 1000, // 15 minutes
    contentType: 'application/octet-stream',
  };

  // Get a v4 signed URL for uploading file
  const [url] = await storage
    .bucket(USER_PHOTOS_BUCKET_NAME)
    .file(fileName)
    .getSignedUrl(options);

  return url;
}

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
