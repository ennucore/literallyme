# Training Hook

When training is complete, the `training-hook` function is called via webhook.
Writes lora weights to database.

## Deploy
```
gcloud functions deploy training-hook-function  --gen2 --region=us-central1 --source=. --entry-point=training-hook --trigger-http --runtime=nodejs20 --allow-unauthenticated
```
