const axios = require('axios');
const fs = require('fs');

// const BASE_URL = 'http://localhost:8080';
const BASE_URL = 'https://api-service-923310519975.us-central1.run.app';
const TEST_ARCHIVE_URL =
  'https://storage.googleapis.com/literallyme-dev-test-photos/user_photos/aleksei_test/raw.zip';
const startTraining = async () => {
  // const token = fs.readFileSync('./dev/.literallyme_token', 'utf8');

  const response = await axios.post(
    `${BASE_URL}/start_training`,
    {
      archiveUrl: TEST_ARCHIVE_URL,
      userId: 'alex',
      targetId: 'literallyalex',
    }
    // {
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${token}`,
    //   },
    // }
  );
  console.log('Training started:', response.data);
};

const generateImages = async () => {
  const response = await axios.post(
    `${BASE_URL}/image_generation`,
    {
      userId: 'alex',
      targetId: 'literallyalex',
      imagePrompt: 'a cinematic portrait of a TOK in central park holding a book and reading it',
    }
  );
  console.log('Image generation started:', response.data);
};

generateImages();
