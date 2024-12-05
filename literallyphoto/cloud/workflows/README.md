## Deploying workflows:

Generation workflow:
```
gcloud workflows deploy generation-workflow \
  --env-vars-file=generation_envs.yaml \
  --source=generation.yaml \
  --service-account=default-account@literallyme.iam.gserviceaccount.com 
```

Training workflow:
```
gcloud workflows deploy training-workflow \
  --source=training.yaml \
  --env-vars-file=training_envs.yaml \
  --service-account=default-account@literallyme.iam.gserviceaccount.com 
```