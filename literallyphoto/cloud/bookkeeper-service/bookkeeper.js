const express = require('express');
const { Firestore } = require('@google-cloud/firestore');

const PROJECT_ID = process.env.PROJECT_ID || 'literallyme-dev';
const firestore = new Firestore({
  projectId: PROJECT_ID,
  databaseId: 'generations-db',
});

const app = express();
const PORT = process.env.PORT || 8080;
const FULL_PATH_PREFIX = `projects/${PROJECT_ID}/databases/generations-db/documents`;

app.use(express.json());

app.listen(PORT);

app.post('/record_images_completed', docResolver, async (req, res) => {
  let { images } = req.body;
  console.log(
    `Received request to record images results for ${
      req.docRef.path
    } images: ${JSON.stringify(images)}`,
  );
  await req.docRef.set(
    {
      images: images,
      status: 'completed',
    },
    { merge: true },
  );
  console.log(`Images recorded for generation ${req.docRef.path}`);
  res.status(200).json({ status: 'success' });
});

app.post('/record_training_completed', docResolver, async (req, res) => {
  let { weightsUrl } = req.body;
  console.log(
    `Received request to record training results for ${req.docRef.path} weightsUrl: ${weightsUrl}`,
  );
  await req.docRef.set(
    {
      weightsUrl: weightsUrl,
      status: 'completed',
    },
    { merge: true },
  );
  console.log(`Training results recorded for ${req.docRef.path}`);
  res.status(200).json({ status: 'success' });
});

async function docResolver(req, res, next) {
  let { document_path } = req.body;
  if (document_path.startsWith(FULL_PATH_PREFIX)) {
    document_path = document_path.substring(FULL_PATH_PREFIX.length);
  }
  const docRef = firestore.doc(document_path);
  const doc = await docRef.get();
  if (!doc.exists) {
    res.status(404).json({ message: 'Doc not found' });
    return;
  }
  req.docRef = docRef;
  req.doc = doc;
  next();
}
