# Deploy instructions (not working until google cloud project is set up)

## Build and deploy
```
gcloud builds submit --tag us-central1-docker.pkg.dev/literallyme-dev/literallyme-main-repo/bookkeeper-service &&
gcloud run deploy bookkeeper-service --image us-central1-docker.pkg.dev/literallyme-dev/literallyme-main-repo/bookkeeper-service --no-allow-unauthenticated --service-account bookkeeper-service-account@literallyme-dev.iam.gserviceaccount.com --region us-central1
```
