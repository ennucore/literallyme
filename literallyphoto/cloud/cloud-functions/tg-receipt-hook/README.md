# Telegram Receipt Hook

When a user purchases a product from Telegram, the `tg-receipt-hook` function is called via webhook.
Writes the transaction to the database and tops up the user's balance.

## Deploy
```
gcloud functions deploy tg-receipt-hook-function  --gen2 --region=us-central1 --source=. --entry-point=tg-receipt-hook --trigger-http --runtime=nodejs20 --allow-unauthenticated
```