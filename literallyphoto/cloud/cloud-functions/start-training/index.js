const Replicate = require('replicate');

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const REPLICATE_MODEL_VERSION = 'e440909d3512c31646ee2e0c7d6f6f4923224863a6a10c494606e79fb5844497';

// URL of training-hook function endpoint
const WEBHOOK_BASE_URL = 'https://us-central1-literallyme.cloudfunctions.net/training-hooks';

const REPLICATE_DEFAULT_TRAINING_SETTINGS = {
  steps: 1250,
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

functions.http('startTraining', async (req, res) => {
  const { archiveUrl, userId, platform } = req.body;
  if (!archiveUrl || !userId) {
    res.status(400).send('Missing archiveUrl or userId');
    return;
  }
  console.log(`Start training for userId: ${userId} archiveUrl: ${archiveUrl}`);

  try {
    if (!platform || platform === 'replicate') {
      await startReplicate(userId, archiveUrl);
      res.status(200).send('Operation completed successfully');
    } else {
      // TODO: add other training platforms when ready
      res.status(400).send('Unsupported platform');
    }
  } catch (error) {
    console.error('Error starting training:', error);
    res.status(500).send('An error occurred while starting the training');
  }
});

async function startReplicate(userId, archiveUrl) {
  const targetTrainingSettings = {
    ...REPLICATE_DEFAULT_TRAINING_SETTINGS,
  };
  targetTrainingSettings.input_images = archiveUrl;
  console.log('trainingSettings', targetTrainingSettings);

  // Default to Replicate if no platform is specified or if platform is 'replicate'
  const modelName = crypto.randomUUID();
  await replicate.models.create('literallyme', modelName, {
    visibility: 'private',
    hardware: 'gpu-a100-large',
  });
  const webhookUrl = getWebhookUrl(userId, targetId);
  await replicate.trainings.create('ostris', 'flux-dev-lora-trainer', REPLICATE_MODEL_VERSION, {
    // You need to create a model on Replicate that will be the destination for the trained version.
    destination: `literallyme/${modelName}`,
    input: targetTrainingSettings,
    webhook: webhookUrl,
  });
}

function getWebhookUrl(userId) {
  return `${WEBHOOK_BASE_URL}/?userId=${userId}`;
}
