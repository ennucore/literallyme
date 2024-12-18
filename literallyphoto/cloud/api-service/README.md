# API Service

Main entrypoint of service that handles `training` and `generate_photo` requests.

# Dev instructions
- Build: `npm install`
- Run locally: `node index.js`. It will be served at http://localhost:8080

## Build and deploy
```
gcloud builds submit --tag us-central1-docker.pkg.dev/literallyme-dev/literallyme-main-repo/api-service &&
gcloud run deploy api-service --image us-central1-docker.pkg.dev/literallyme-dev/literallyme-main-repo/api-service --allow-unauthenticated --service-account api-service-account@literallyme-dev.iam.gserviceaccount.com --region us-central1
```


## Test training routing

1. Generate a signed URL for uploading a training archive:
```
curl -X POST ".../upload_archive_url" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"userId": "<user_id>"}'
```
In response you'll have `{'upload_url': <url>}`

2. Upload a training archive to the signed URL.
```
curl -X PUT -H 'Content-Type: application/octet-stream' --upload-file <your_file> '<upload_url>'
```

3. Start training
```
curl -X POST ".../start_training" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"userId": "<user_id>", "targetId": "<target_id>"}'
```
