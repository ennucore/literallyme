# Payments function

Handles payments and refunds for training and image generation.

## Deploy
```
gcloud functions deploy payments-function  --gen2 --region=us-central1 --source=. --entry-point=payments --trigger-http --runtime=nodejs20 --no-allow-unauthenticated
```