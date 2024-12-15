## Build and deploy
```
gcloud builds submit --tag  us-central1-docker.pkg.dev/literallyme-dev/literallyme-main-repo/image-gen-service &&
gcloud run deploy image-gen-service --image us-central1-docker.pkg.dev/literallyme-dev/literallyme-main-repo/image-gen-service --service-account image-gen-service-account@literallyme-dev.iam.gserviceaccount.com --no-allow-unauthenticated --region us-central1
```
