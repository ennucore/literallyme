const { Firestore } = require('@google-cloud/firestore');

const firestore = new Firestore({
  projectId: process.env.PROJECT_ID,
  databaseId: 'generations-db',
});

const TRAINING_COST = 500;
const IMAGE_GEN_COST = 10;

// TODO: Implement balance checking
async function hasBalanceForImageGeneration(userId) {
  const doc = await firestore.collection('balances').doc(userId).get();

  if (!doc.exists) {
    console.error(`User ${userId} doesn't have a balance`);
    return false;
  }

  const balance = doc.data().balance;
  console.log(
    `Checking generation balance for user ${userId} balance ${balance}`,
  );
  return balance >= IMAGE_GEN_COST;
}

async function hasBalanceForTraining(userId) {
  const doc = await firestore.collection('balances').doc(userId).get();

  if (!doc.exists) {
    console.error(`User ${userId} doesn't have a balance`);
    return false;
  }

  const balance = doc.data().balance;
  console.log(
    `Checking generation balance for user ${userId} balance ${balance}`,
  );
  return balance >= TRAINING_COST;
}

async function getBalance(userId) {
  const doc = await firestore.collection('balances').doc(userId).get();
  if (!doc.exists) {
    console.error(`User ${userId} doesn't have a balance`);
    return 0;
  }
  const balance = doc.data().balance;
  console.log(`User ${userId} balance ${balance}`);
  return balance;
}

module.exports = {
  hasBalanceForImageGeneration,
  hasBalanceForTraining,
  getBalance,
};
