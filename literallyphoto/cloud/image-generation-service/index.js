'use strict';

const express = require('express');
const Replicate = require('replicate');
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT) || 8080;
const PROJECT_ID = process.env.PROJECT_ID || 'literallyme-dev';
const DEFAULT_REPLICATE_MODEL =
  'lucataco/flux-dev-lora:091495765fa5ef2725a175a57b276ec30dc9d39c22d30410f2ede68a3eab66b3';

const BUCKET_NAME = `${PROJECT_ID}_user_generations`;

const DEFAULT_REPLICATE_OPTIONS = {
  aspect_ratio: '9:16',
  prompt_strength: 1.0,
  num_outputs: 4,
  num_inference_steps: 35,
  guidance_scale: 3.5,
  lora_scale: 1,
  output_format: 'png',
  output_quality: 100,
};

const storage = new Storage();

const app = express();
app.listen(PORT);
app.use(express.json());

app.post('/generate_images', async (req, res) => {
  let { userId, targetId, weightsUrl, imagePrompt, generationId, model } =
    req.body;

  console.log(
    `Received image generation request for User ID: ${userId}, Target ID: ${targetId}, Generation ID: ${generationId}`,
  );

  if (!weightsUrl) {
    res
      .status(400)
      .json({ error: 'Weights URL is required in the request body' });
    return;
  }

  let input = null;
  let generateFunction;
  if (!model || model === 'replicate-flux-dev-lora') {
    const replicate = new Replicate();
    model = DEFAULT_REPLICATE_MODEL;
    console.log(`Using model replicate-flux-dev-lora`);
    input = {
      ...DEFAULT_REPLICATE_OPTIONS,
      hf_lora: weightsUrl,
      prompt: imagePrompt,
    };
    generateFunction = replicate.run.bind(replicate, model, { input: input });
  } else {
    res.status(400).json({ error: 'Invalid model' });
    return;
  }
  console.log(
    `Running image generation on ${model} and ${JSON.stringify(input)}`,
  );

  try {
    const output = await generateImagesWithRetry(generateFunction);
    console.log(`Generated ${output.length} images`);
    const localFiles = await Promise.all(
      output.map(async (imageUrl) => {
        return downloadImage(imageUrl.trim());
      }),
    );
    console.log(`Downloaded ${localFiles.length} images`);
    const storageFiles = await Promise.all(
      localFiles.map(async (localFilePath) => {
        return uploadToStorage(
          localFilePath,
          userId,
          targetId,
          generationId,
        );
      }),
    );
    console.log(`Uploaded ${storageFiles.length} images`);
    const storageUrls = storageFiles.map((file) => file.cloudStorageURI);
    const result = { success: true, result: storageUrls };
    console.log(`Generated images ${storageUrls}`);
    res.status(200).json(result);
  } catch (error) {
    console.error('Failed to generate images after multiple attempts:', error);
    res
      .status(500)
      .json({ error: 'Failed to generate images after multiple attempts.' });
  }
});

async function downloadImage(imageUrl) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  // Filename is based on replicate link structure in order to reconstruct the url
  // Link example: https://replicate.delivery/yhqm/Ocga4ugC8QItBtjeNe4meeiqz07XF6xhe3CAKyqbuLPNX27cC/out-3.png
  const fileName = new URL(imageUrl).pathname.substring(1).replace(/\//g, '_');
  const localFilePath = path.join(__dirname, 'downloads', fileName);
  fs.mkdirSync(path.dirname(localFilePath), { recursive: true });
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(localFilePath, buffer);
  console.log(`Image saved locally at ${localFilePath}`);
  return localFilePath;
}

async function uploadToStorage(
  localFilePath,
  userId,
  targetId,
  generationId,
) {
  const bucket = storage.bucket(BUCKET_NAME);
  const fileName = path.basename(localFilePath);
  const destination = `${userId}/${targetId}/${generationId}/images/${fileName}`;
  const file = bucket.file(destination);
  await bucket.upload(localFilePath, { destination });
  console.log(`Image uploaded to GCS at ${destination}`);
  return file;
}

async function generateImagesWithRetry(
  generateFunction,
  targetRunsCount = 1,
  maxFailedAttempts = 4,
) {
  console.log(
    `Generating images with retry ${maxFailedAttempts} times, target runs: ${targetRunsCount}`,
  );
  let successfulRuns = 0;
  let failedAttempts = 0;
  let totalOutputs = [];
  let delay = 1000;

  while (
    failedAttempts < maxFailedAttempts &&
    successfulRuns < targetRunsCount
  ) {
    try {
      const output = await generateFunction();
      console.log(
        `Successful image run ${successfulRuns + 1} of ${targetRunsCount}`,
      );
      successfulRuns++;
      totalOutputs = totalOutputs.concat(output);

      if (successfulRuns >= targetRunsCount) {
        break;
      }
    } catch (error) {
      failedAttempts++;
      console.log(`Failed image pack generation:`, error);

      if (failedAttempts < maxFailedAttempts) {
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
  }

  if (successfulRuns >= targetRunsCount) {
    console.log(`Successfully achieved ${targetRunsCount} successful runs.`);
    return totalOutputs;
  } else {
    throw new Error(
      `Failed to achieve ${targetRunsCount} successful runs before reaching ${maxFailedAttempts} failed attempts.`,
    );
  }
}
