const functions = require('@google-cloud/functions-framework');
const { Firestore } = require('@google-cloud/firestore');

const PROJECT_ID = process.env.PROJECT_ID || 'literallyme-dev';
const firestore = new Firestore({
  projectId: PROJECT_ID,
  databaseId: 'generations-db',
});

functions.http('tg-receipt-hook', async (req, res) => {
  const telegramPaymentsWebhookToken =
    process.env.TELEGRAM_PAYMENTS_WEBHOOK_TOKEN;
  if (!telegramPaymentsWebhookToken) {
    console.error('TELEGRAM_PAYMENTS_WEBHOOK_TOKEN is not set');
    res.status(500).send('Server configuration error');
    return;
  }
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).send('Authorization header is missing');
    return;
  }

  const [bearer, token] = authHeader.split(' ');
  if (bearer !== 'Bearer' || token !== telegramPaymentsWebhookToken) {
    res.status(401).send('Invalid authorization token');
    return;
  }

  const uid = req.body.customer_user_id;
  if (!uid) {
    console.log('customer_user_id not present');
    res.status(400).json({ error: 'customer_user_id not present' });
    return;
  }

  const topUpCount = req.body.top_up_count;
  if (!topUpCount) {
    console.log('top_up_count not present');
    res.status(400).json({ error: 'top_up_count not present' });
    return;
  }

  const transactionId = req.body.transaction_id;
  if (!transactionId) {
    console.log('transaction_id not present');
    res.status(400).json({ error: 'transaction_id not present' });
    return;
  }

  await processTransaction(topUpCount, uid, transactionId);

  res.status(200).json({ status: 'success' });
});

async function processTransaction(topUpCount, uid, transactionId) {
  const docRef = firestore.collection('balances').doc(uid);
  await firestore.runTransaction(async (transaction) => {
    const doc = await transaction.get(docRef);
    const balance = doc.exists ? doc.data().balance : 0;
    const transactions = doc.exists ? doc.data().transactions : [];
    const newTransaction = {
      created: new Date().toISOString(),
      topUpCount,
      transactionId,
    };
    transaction.set(
      docRef,
      {
        balance: balance + topUpCount,
        transactions: [...transactions, newTransaction],
      },
      { merge: true },
    );
  });
}
