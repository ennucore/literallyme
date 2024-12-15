# Push to prod (so far manual)
```gcloud builds submit --tag  us-central1-docker.pkg.dev/literallyme/literallyme-main-repo/image-gen-service-test```

```
gcloud run deploy image-gen-service-test --image us-central1-docker.pkg.dev/literallyme/literallyme-main-repo/image-gen-service-test --service-account default-account@literallyme.iam.gserviceaccount.com --allow-unauthenticated
```
