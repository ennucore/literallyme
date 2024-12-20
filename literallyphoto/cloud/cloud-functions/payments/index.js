const functions = require('@google-cloud/functions-framework');
const { Firestore } = require('@google-cloud/firestore');

const firestore = new Firestore({
  projectId: process.env.PROJECT_ID,
  databaseId: 'generations-db',
});

const operationBalanceMapping = {
  tryRecordImageGeneration: -10,
  refundImageGeneration: 10,
  tryRecordTraining: -500,
  refundTraining: 500,
};

functions.http('payments', async (req, res) => {
  const userId = req.body.userId;
  const operation = req.body.operation;

  if (!userId) {
    res.status(400).send('userId is required');
    return;
  }

  if (!operation) {
    res.status(400).send('operation is required');
    return;
  }

  let result;
  switch (operation) {
    case 'tryRecordImageGeneration':
    case 'tryRecordTraining':
      result = await tryRecordOperation(userId, operation);
      break;
    case 'refundImageGeneration':
    case 'refundTraining':
      result = await refundOperation(userId, operation);
      break;
    default:
      res.status(400).send('Invalid operation');
      return;
  }

  if (result === false) {
    res.status(402).send(`Insufficient balance or user not found`);
    return;
  }
  res.status(200).send();
});

async function tryRecordOperation(userId, operation) {
  return await firestore.runTransaction(async (transaction) => {
    console.log(`operation ${operation} for user ${userId}`);
    const docRef = firestore.collection('balances').doc(userId);
    const doc = await transaction.get(docRef);

    if (!doc.exists) {
      console.error(`User ${userId} doesn't have a balance`);
      return false;
    }

    const balance = doc.data().balance;
    const change = operationBalanceMapping[operation];
    console.log(`Found balance for user ${userId}: ${balance}`);
    if (balance + change < 0) {
      console.warn(
        `Insufficient balance for user ${userId}: current ${balance}, required ${change}`,
      );
      return false;
    }

    transaction.update(docRef, { balance: balance + change });
    console.log(`Updated balance for user ${userId}: ${balance + change}`);
    return true;
  });
}

async function refundOperation(userId, operation) {
  return await firestore.runTransaction(async (transaction) => {
    console.log(`operation ${operation} for user ${userId}`);
    const docRef = firestore.collection('balances').doc(userId);
    const doc = await transaction.get(docRef);

    if (!doc.exists) {
      console.error(`User ${userId} doesn't have a balance`);
      return false;
    }
    const balance = doc.data().balance;
    const change = operationBalanceMapping[operation];
    console.log(`Found balance for user ${userId}: ${balance}`);

    transaction.update(docRef, { balance: balance + change });
    console.log(`Refunded balance for user ${userId}: ${balance + change}`);
    return true;
  });
}
