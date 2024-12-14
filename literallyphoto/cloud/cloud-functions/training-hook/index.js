const functions = require('@google-cloud/functions-framework');
const { GoogleAuth } = require('google-auth-library');
const auth = new GoogleAuth();

functions.http('training-hook', async (req, res) => {
  const userId = req.query.userId;
  // TODO: Get webhooks from DB
  const callbackUrl = atob(req.body.callbackUrl);
  console.log(`Received training results userId: ${userId} callbackUrl: ${callbackUrl}`);
  let weightsUrl = req.body.output.weights;
  let status = req.body.status;

  if (!userId) {
    res.status(400).send(`missing userId, received: ${req.query} and ${req.body}`);
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
    `Finished training userId: ${userId} callbackUrl: ${callbackUrl} weightsUrl: ${weightsUrl} status: ${status}`
  );
  await recordTraining(userId, callbackUrl, weightsUrl, status);
  res.status(200).json({ status: 'success' });
});

async function recordTraining(userId, callbackUrl, weightsUrl, status) {
  // TODO: Should write weightsUrl to database for give userId
  // TODO: Should call callback if it exists returning weightsUrl to continue geneneration
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
