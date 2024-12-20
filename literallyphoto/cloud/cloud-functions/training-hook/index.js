const functions = require('@google-cloud/functions-framework');
const { GoogleAuth } = require('google-auth-library');
const auth = new GoogleAuth();

functions.http('training-hook', async (req, res) => {
  const userId = req.query.userId;
  const callbackUrl = atob(req.query.callbackUrl);
  const targetId = req.query.targetId;
  console.log(
    `Received training results for userId: ${userId} targetId: ${targetId} callbackUrl: ${callbackUrl}`,
  );
  console.log(`Received body: ${JSON.stringify(req.body)}`);
  let weightsUrl = req.body.output.weights;
  let status = req.body.status;

  if (!userId || !targetId) {
    res
      .status(400)
      .send(
        `missing userId or targetId, received: ${req.query} and ${req.body}`,
      );
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
    `Finished training userId: ${userId} targetId: ${targetId} callbackUrl: ${callbackUrl} weightsUrl: ${weightsUrl} status: ${status}`,
  );
  await callCallback(callbackUrl, weightsUrl, status);
  res.status(200).json({ status: 'success' });
});

async function callCallback(callbackUrl, weightsUrl, status) {
  console.log(
    `Calling callback: ${callbackUrl} with weightsUrl: ${weightsUrl} and status: ${status}`,
  );
  const token = await auth.getAccessToken();
  await fetch(callbackUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ weightsUrl: weightsUrl, status: status }),
  });
}
