## Deploying workflows:

Generation workflow:
```
gcloud workflows deploy workflow-image-generation \
  --env-vars-file=image_generation_envs.yaml \
  --source=generation-workflow.yaml \
  --service-account=workflow-sa@literallyme-dev.iam.gserviceaccount.com
```

Training workflow:
```
gcloud workflows deploy workflow-training \
  --source=training-workflow.yaml \
  --env-vars-file=training_envs.yaml \
  --service-account=workflow-sa@literallyme-dev.iam.gserviceaccount.com
```