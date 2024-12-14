const functions = require('@google-cloud/functions-framework');
const { GoogleAuth } = require('google-auth-library');
const auth = new GoogleAuth();
const { FieldValue } = require('@google-cloud/firestore');
const { Firestore } = require('@google-cloud/firestore');

const PROJECT_ID = 'literallyme-dev';
const DATABASE_ID = 'generations-db';
const firestore = new Firestore({
  projectId: PROJECT_ID,
  databaseId: DATABASE_ID,
});

functions.http('training-hook', async (req, res) => {
  const userId = req.query.userId;
  const callbackUrl = atob(req.query.callbackUrl);
  const targetId = req.query.targetId;
  // TODO: Get webhooks from DB
  console.log(`Received training results for userId: ${userId} targetId: ${targetId} callbackUrl: ${callbackUrl}`);
  console.log(`Received body: ${JSON.stringify(req.body)}`);
  let weightsUrl = req.body.output.weights;
  let status = req.body.status;

  if (!userId || !targetId) {
    res.status(400).send(`missing userId or targetId, received: ${req.query} and ${req.body}`);
    return;
  }

  if (status === 'succeeded') {
    if (!weightsUrl) {
      status = 'failed';
      weightsUrl = '';
    }
  } else {
    weightsUrl = '';
    status = 'failed';
  }

  console.log(
    `Finished training userId: ${userId} targetId: ${targetId} callbackUrl: ${callbackUrl} weightsUrl: ${weightsUrl} status: ${status}`
  );
  await recordTraining(userId, targetId, callbackUrl, weightsUrl, status);
  res.status(200).json({ status: 'success' });
});

async function recordTraining(userId, targetId, callbackUrl, weightsUrl, status) {
  // TODO: Should write weightsUrl to database for give userId
  // TODO: Should call callback if it exists returning weightsUrl to continue geneneration
  const docRef = firestore.doc(`trainings/${userId}/targets/${targetId}`);
  await docRef.set({
    weightsUrl: weightsUrl,
    status: status,
    updated: FieldValue.serverTimestamp(),
  }, { merge: true });
  await callCallback(callbackUrl, weightsUrl, status);
}

async function callCallback(callbackUrl, weightsUrl, status) {
  console.log(
    `Calling callback: ${callbackUrl} with weightsUrl: ${weightsUrl} and status: ${status}`
  );
  // TODO: Add auth for sending requests to callback
  const token = await auth.getAccessToken();
  const response = await fetch(callbackUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ weightsUrl: weightsUrl, status: status }),
  });
}
