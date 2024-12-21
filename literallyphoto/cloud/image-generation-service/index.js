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

const BUCKET_NAME = `${PROJECT_ID}_image_generations`;

const DEFAULT_REPLICATE_OPTIONS = {
  aspect_ratio: '9:16',
  prompt_strength: 1.0,
  num_outputs: 1,
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
  let {
    userId,
    targetId, // TODO: May be it's better to write images to path associated with user
    generationId,
    imagePrompt,
    numImagesToGenerate,
    weightsUrl,
    model,
  } = req.body;

  console.log(
    `Received image generation request for User ID: ${userId} prompt: ${imagePrompt}`,
  );

  if (!weightsUrl) {
    res
      .status(400)
      .json({ error: 'Weights URL is required in the request body' });
    return;
  }

  if (!numImagesToGenerate) {
    numImagesToGenerate = 1;
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
    // Generate images
    const output = await generateImagesWithRetry(
      generateFunction,
      numImagesToGenerate,
    );
    console.log(`Generated ${output.length} images`);
    if (output.length === 0) {
      // If no images were generated, respond with failure
      res.status(200).json({ images: [], status: 'failed' });
      return;
    }

    // Download images
    const localFiles = await Promise.all(
      output.map(async (imageUrl) => {
        return downloadImage(imageUrl.trim());
      }),
    );
    console.log(`Downloaded ${localFiles.length} images`);

    // Upload images to storage
    const storageFiles = await Promise.all(
      localFiles.map(async (localFilePath) => {
        return uploadToStorage(localFilePath);
      }),
    );
    console.log(`Uploaded ${storageFiles.length} images to storage`);

    const storageUrls = storageFiles.map((file) => file.cloudStorageURI);
    const result = { images: storageUrls, status: 'completed' };
    console.log(`Generated images ${storageUrls}`);

    // Clean up local files
    localFiles.forEach((filePath) => {
      try {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up local file: ${filePath}`);
      } catch (err) {
        console.error(`Failed to clean up local file: ${filePath}`, err);
      }
    });
    console.log(`Sending result: ${JSON.stringify(result)}`);
    res.status(200).json(result);
  } catch (error) {
    console.error('Failed to generate images after multiple attempts:', error);
    res.status(200).json({ images: [], status: 'failed' });
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

async function uploadToStorage(localFilePath) {
  const bucket = storage.bucket(BUCKET_NAME);
  const destination = path.basename(localFilePath);
  const file = bucket.file(destination);
  await bucket.upload(localFilePath, { destination });
  console.log(`Image uploaded to GCS at ${destination}`);
  return file;
}

async function generateImagesWithRetry(
  generateFunction,
  numImagesToGenerate,
  maxFailedAttempts = 4,
) {
  console.log(
    `Generating images with retry ${maxFailedAttempts} times, images to generate: ${numImagesToGenerate}`,
  );
  let generatedImages = [];
  let failedAttempts = 0;
  let delay = 1000;

  while (
    failedAttempts < maxFailedAttempts &&
    generatedImages.length < numImagesToGenerate
  ) {
    try {
      const output = await generateFunction();
      console.log(
        `Successful image run ${
          generatedImages.length + 1
        } of ${numImagesToGenerate}`,
      );
      generatedImages = generatedImages.concat(output);
      if (generatedImages.length >= numImagesToGenerate) {
        break;
      }
    } catch (error) {
      failedAttempts++;
      console.log(`Failed image generation attempt:`, error);

      if (failedAttempts < maxFailedAttempts) {
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
  }

  if (generatedImages.length >= numImagesToGenerate) {
    console.log(`Successfully generated ${generatedImages.length} images.`);
    return generatedImages;
  } else {
    return [];
  }
}
