# API Service

Main entrypoint of service that handles `training` and `generate_photo` requests.

# Dev instructions
- Build: `npm install`
- Run locally: `node index.js`. It will be served at http://localhost:8080


# Deploy instructions (not working until google cloud project is set up)

## Build and deploy
```
gcloud builds submit --tag us-central1-docker.pkg.dev/literallyme-dev/literallyme-main-repo/api-service &&
gcloud run deploy api-service --image us-central1-docker.pkg.dev/literallyme-dev/literallyme-main-repo/api-service --allow-unauthenticated --service-account api-service-account@literallyme-dev.iam.gserviceaccount.com --region us-central1
```

