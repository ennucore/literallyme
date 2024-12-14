const functions = require('@google-cloud/functions-framework');
const Replicate = require('replicate');

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// TODO: Create organization for literallyme
const REPLICATE_ORGANIZATION_NAME = 'hellesgrind';
const REPLICATE_MODEL_VERSION = 'e440909d3512c31646ee2e0c7d6f6f4923224863a6a10c494606e79fb5844497';

// URL of training-hook function endpoint
const WEBHOOK_BASE_URL =
  'https://us-central1-literallyme-dev.cloudfunctions.net/training-hook-function';

const REPLICATE_DEFAULT_TRAINING_SETTINGS = {
  steps: 10,
  lora_rank: 16,
  optimizer: 'adamw8bit',
  batch_size: 2,
  resolution: '512,768,1024',
  autocaption: false,
  trigger_word: 'TOK',
  learning_rate: 0.0005,
  caption_dropout_rate: 0.05,
  cache_latents_to_disk: true,
};

functions.http('training-start', async (req, res) => {
  const { archiveUrl, userId, targetId, callbackUrl, platform } = req.body;
  if (!archiveUrl || !userId || !targetId) {
    res.status(400).send('Missing archiveUrl, userId, or targetId');
    return;
  }
  console.log(`Start training for userId: ${userId} targetId: ${targetId} archiveUrl: ${archiveUrl}`);
  console.log(`Callback URL: ${callbackUrl}`);

  const webhookUrl = getWebhookUrl(userId, targetId, callbackUrl);
  console.log(`Generated webhook URL: ${webhookUrl}`);
  try {
    if (!platform || platform === 'replicate') {
      // TODO: Write callbacks to DB
      await startReplicate(webhookUrl, archiveUrl);
      res.status(200).send('Training started successfully');
    } else {
      // TODO: add other training platforms when ready
      res.status(400).send('Unsupported platform');
    }
  } catch (error) {
    console.error('Error starting training:', error);
    res.status(500).send('An error occurred while starting the training');
  }
});

async function startReplicate(webhookUrl, archiveUrl) {
  const targetTrainingSettings = {
    ...REPLICATE_DEFAULT_TRAINING_SETTINGS,
  };
  targetTrainingSettings.input_images = archiveUrl;
  console.log('trainingSettings', targetTrainingSettings);

  // Default to Replicate if no platform is specified or if platform is 'replicate'
  const modelName = crypto.randomUUID();
  await replicate.models.create(REPLICATE_ORGANIZATION_NAME, modelName, {
    visibility: 'private',
    hardware: 'gpu-a100-large',
  });
  response = await replicate.trainings.create(
    'ostris',
    'flux-dev-lora-trainer',
    REPLICATE_MODEL_VERSION,
    {
      // You need to create a model on Replicate that will be the destination for the trained version.
      destination: `${REPLICATE_ORGANIZATION_NAME}/${modelName}`,
      input: targetTrainingSettings,
      webhook: webhookUrl,
    }
  );
}

function getWebhookUrl(userId, targetId, callbackUrl) {
  const encodedCallbackUrl = btoa(callbackUrl);
  const params = new URLSearchParams({
    userId,
    targetId,
    callbackUrl: encodedCallbackUrl,
  });
  const webhookUrl = `${WEBHOOK_BASE_URL}/?${params.toString()}`;
  console.log(`Webhook URL: ${webhookUrl}`);
  return webhookUrl;
}
