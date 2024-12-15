# Deploy instructions (not working until google cloud project is set up)

## Build
```
gcloud builds submit --tag us-central1-docker.pkg.dev/literallyme-dev/literallyme-main-repo/bookkeeper-service
```

## Deploy

```
gcloud run deploy bookkeeper-service --image us-central1-docker.pkg.dev/literallyme-dev/literallyme-main-repo/bookkeeper-service --no-allow-unauthenticated --service-account bookkeeper-service-account@literallyme-dev.iam.gserviceaccount.com
```