# Start Training

Starts a training workflow for a given user, resulting lora weights are returned via webhook and handled by the `training-hook` function.

Deploy:
```
gcloud functions deploy training-start-function  --gen2 --region=us-central1 --source=. --entry-point=training-start --trigger-http --runtime=nodejs20 --no-allow-unauthenticated
```
