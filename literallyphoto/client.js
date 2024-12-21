const axios = require('axios');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.secrets' });

// const AUTH_TOKEN = process.env.AUTH_TOKEN || 'alex';
const USER_ID = process.env.USER_ID || 'alex';

// const BASE_URL = 'http://localhost:8080';
const BASE_URL = 'https://api-service-923310519975.us-central1.run.app';
const TEST_ARCHIVE_PATH = './raw.zip';

async function startTraining() {
  // Issue auth token
  const token = (
    await axios.post(`${BASE_URL}/mock_auth`, {
      userId: USER_ID,
    })
  ).data.token;
  console.log('TOKEN', token);

  // Get upload url and target id
  const uploadUrlResponse = await axios.get(`${BASE_URL}/upload_archive_url`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const uploadUrl = uploadUrlResponse.data.uploadUrl;
  const targetId = uploadUrlResponse.data.targetId;

  // Upload archive
  await axios.put(uploadUrl, fs.createReadStream(TEST_ARCHIVE_PATH), {
    headers: {
      'Content-Type': 'application/octet-stream',
    },
  });

  // Start training
  const trainingResponse = await axios.post(
    `${BASE_URL}/start_training`,
    {
      targetId: targetId,
      targetName: 'Wow this is literally me',
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  let targets = await getTargets(token);
  let currentTarget = targets.find((target) => target.targetId === targetId);
  while (currentTarget.status !== 'completed') {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    targets = await getTargets(token);
    currentTarget = targets.find((target) => target.targetId === targetId);
    console.log('CURRENT TARGET', currentTarget);
  }
}

async function generateImages() {
  const token = (
    await axios.post(`${BASE_URL}/mock_auth`, {
      userId: USER_ID,
    })
  ).data.token;
  console.log('TOKEN', token);
  const targets = await getTargets(token);
  console.log('TARGETS', targets);
  const targetId = targets[0].targetId;
  console.log('TARGET ID', targetId);
  const response = await axios.post(
    `${BASE_URL}/image_generation`,
    {
      targetId: targetId,
      imagePrompt:
        'a cinematic portrait of a TOK in central park holding a book and reading it',
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  const generationId = response.data.generationId;
  let generations = await getGenerations(token);
  let currentGeneration = generations.find(
    (generation) => generation.generationId === generationId,
  );
  while (
    currentGeneration.status !== 'completed' &&
    currentGeneration.status !== 'failed'
  ) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    generations = await getGenerations(token);
    currentGeneration = generations.find(
      (generation) => generation.generationId === generationId,
    );
    console.log('CURRENT GENERATION', currentGeneration);
  }
  console.log('GENERATIONS', generations);
}

async function getTargets(token) {
  if (!token) {
    token = (await axios.post(
      `${BASE_URL}/mock_auth`,
      {
        userId: USER_ID,
      }
    )).data.token;
  }
  const response = await axios.get(`${BASE_URL}/get_targets`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}

async function getGenerations(token) {
  if (!token) {
    token = (
      await axios.post(`${BASE_URL}/mock_auth`, {
        userId: USER_ID,
      })
    ).data.token;
  }
  const response = await axios.get(`${BASE_URL}/get_generations`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  console.log('Generations:', response.data);
  return response.data;
}

async function topUpBalance() {
  const paymentsHookUrl = 'https://us-central1-literallyme-dev.cloudfunctions.net/tg-receipt-hook-function';
  const payload = {
    customer_user_id: USER_ID,
    top_up_count: 1000,
    transaction_id: '1231351',
  };
  const response = (
    await axios.post(`${paymentsHookUrl}`, payload, {
      headers: {
        Authorization: `Bearer ${process.env.TELEGRAM_PAYMENTS_WEBHOOK_TOKEN}`,
      },
    })
  );
  console.log('Top up response:', response.data);  
}

async function getBalance() {
  const token = (
    await axios.post(`${BASE_URL}/mock_auth`, {
      userId: USER_ID,
    })
  ).data.token;
  const balance = await axios.get(`${BASE_URL}/get_balance`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  console.log('Balance:', balance.data.balance);
}

getBalance();
// generateImages();

// startTraining();
// topUpBalance();
