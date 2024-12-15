const express = require('express');
const { Firestore } = require('@google-cloud/firestore');

const firestore = new Firestore({
  projectId: process.env.PROJECT_ID,
  databaseId: 'generations-db',
});

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

app.listen(PORT);

app.get('/record_images_completed', async (req, res) => {
  const { document_path, images } = req.body;
  console.log(`Received request to record images completed for ${document_path} images: ${JSON.stringify(images)}`);
  const generationDocRef = firestore.doc(document_path);
  const generationDoc = await generationDocRef.get();
  if (!generationDoc.exists) {
    res.status(404).json({ message: 'Generation doc not found' });
    return;
  }

  await generationDocRef.set({
    images: images,
    status: 'completed',
  }, { merge: true });
  console.log(`Images recorded for generation ${document_path}`);
  res.status(200).json({ status: 'success' });
});
