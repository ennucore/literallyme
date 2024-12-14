# Start Training

Starts a training workflow for a given user, resulting lora weights are returned via webhook and handled by the `training-hook` function.

Deploy:
```
gcloud functions deploy training-start-function  --gen2 --region=us-central1 --source=. --entry-point=training_start --trigger-http --runtime=nodejs20 --no-allow-unauthenticated
```

Test:
```
curl -X POST http://localhost:8080/training-start -H "Content-Type: application/json" -d '{"archiveUrl" : "", "userId": "literallymetest", "platform": "replicate"}'
```
