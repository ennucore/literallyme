const functions = require('@google-cloud/functions-framework');
const { Firestore } = require('@google-cloud/firestore');
const { GoogleAuth } = require('google-auth-library');
const auth = new GoogleAuth();

const firestore = new Firestore({
  projectId: 'literallyme',
  databaseId: 'trainings-db',
});

functions.http('checkTrainings', async (req, res) => {
  const { callbackUrl, userId } = req.body;
  console.log(`Received request: ${JSON.stringify(req.body)}`);
  if (!callbackUrl || !userId || !targetId) {
    res
      .status(400)
      .send(`Missing callbackUrl or userId or targetId, received: ${JSON.stringify(req.body)}`);
    return;
  }

  const docRef = firestore.doc(`trainings/${userId}`);
  const doc = await docRef.get();
  const docData = doc.data();
  if (!doc.exists) {
    res.status(412).json({ error: 'There is no ready or in-progress training' });
  }

  try {
    const status = docData.status;
    const weightsUrl = docData.weightsUrl;

    if (status === 'failed') {
      console.log(`Training failed, returning callback with status: ${status}`);
      callCallback(res, callbackUrl, '', status);
      return;
    }
    if (status === 'succeeded' && weightsUrl) {
      console.log(
        `Training succeeded, returning callback with status: ${status} and weightsUrl: ${weightsUrl}`
      );
      callCallback(res, callbackUrl, weightsUrl, status);
      return;
    }

    console.log(`No trained weights, adding callbackUrl: ${callbackUrl} to callbacks`);
    await firestore.runTransaction(async (transaction) => {
      const currentCallbacks = docData.callbacks || [];
      currentCallbacks.push(callbackUrl);
      transaction.set(
        docRef,
        {
          callbacks: currentCallbacks,
        },
        { merge: true }
      );
    });
    res.status(200).send('Operation completed successfully');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal server error');
  }
});

async function callCallback(res, callbackUrl, weightsUrl, status) {
  const token = await auth.getAccessToken();
  const response = await fetch(callbackUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ weightsUrl: weightsUrl, status: status }),
  });
  console.log(response);
  res.status(200).json({ status: 'success' });
}
