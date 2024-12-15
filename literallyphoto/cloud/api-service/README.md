# API Service

Main entrypoint of service that handles `training` and `generate_photo` requests.

# Dev instructions
- Build: `npm install`
- Run locally: `node index.js`. It will be served at http://localhost:8080


# Deploy instructions (not working until google cloud project is set up)

## Build
```
gcloud builds submit --tag us-central1-docker.pkg.dev/literallyme-dev/literallyme-main-repo/api-service
```

## Deploy

```
gcloud run deploy api-service --image us-central1-docker.pkg.dev/literallyme-dev/literallyme-main-repo/api-service --allow-unauthenticated --service-account api-service-account@literallyme-dev.iam.gserviceaccount.com
```

## Deploy locally

```
PORT=8080 && \
docker pull us-central1-docker.pkg.dev/literallyme-dev/literallyme-main-repo/api-service:latest && \
docker run -p 9090:${PORT} -e PORT=${PORT} us-central1-docker.pkg.dev/literallyme-dev/literallyme-main-repo/api-service:latest
```

## Build and run locally

```
PORT=8080 && node index.js
```

```
gcloud projects get-iam-policy literallyme-dev \
    --flatten="bindings[].members" \
    --format="table(bindings.role)" \
    --filter="bindings.members:literallyme-dev@appspot.gserviceaccount.com"
```