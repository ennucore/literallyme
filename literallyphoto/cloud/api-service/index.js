`use strict`;

const express = require('express');
const { ExecutionsClient } = require('@google-cloud/workflows');
const { firestore } = require('./firebase');
const { FieldValue } = require('@google-cloud/firestore');
const { Storage } = require('@google-cloud/storage');
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

const storage = new Storage();
const executionsClient = new ExecutionsClient();

const app = express();
app.use(cors());
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
app.use(express.raw({ type: 'application/zip', limit: '1Gb' }));
app.use(express.json());

app.post(`/start_training`, authenticateUser, async (req, res) => {
  const { userId } = req.user.id;
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
  const { userId } = req.user.id;
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

app.post('/upload_archive_url', authenticateUser, async (req, res) => {
  const { userId } = req.user.id;
  let { targetId } = req.body;
  if (!targetId) {
    console.log(`targetId not provided, generating random targetId`);
    targetId = crypto.randomUUID();
  }
  const url = await generateV4UploadSignedUrl(userId, targetId);
  console.log(`upload_archive_url ${url}}`);
  await firestore
    .collection('trainings')
    .doc(userId)
    .collection('targets')
    .doc(targetId)
    .set({
      weightsUrl: '',
      status: 'uninitialized',
      created: FieldValue.serverTimestamp(),
    });
  console.log(`created target ${targetId} for user ${userId}`);
  res.status(200).json({
    upload_url: url,
    target_id: targetId,
  });
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
