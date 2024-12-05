const functions = require('@google-cloud/functions-framework');
const { GoogleAuth } = require('google-auth-library');
const auth = new GoogleAuth();

functions.http('training-hook', async (req, res) => {
  const userId = req.query.userId;
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

  console.log(`Finished training`);
  console.log(`userId: ${userId}`);
  console.log(`weightsUrl: ${weightsUrl}`);
  console.log(`status: ${status}`);
  await recordTraining(userId, weightsUrl, status);
  res.status(200).json({ status: 'success' });
});

async function recordTraining(userId, weightsUrl, status) {
  // TODO: Should write weightsUrl to database for give userId
  // TODO: Should call callback if it exists returning weightsUrl to continue geneneration
}

async function callCallback(callbackUrl, weightsUrl, status) {
  console.log(
    `Calling callback: ${callbackUrl} with weightsUrl: ${weightsUrl} and status: ${status}`
  );
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
