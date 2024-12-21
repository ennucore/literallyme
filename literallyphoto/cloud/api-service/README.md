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

## Test training

1. Authorize with the API service:

```
curl -X POST "https://api-service-923310519975.us-central1.run.app/mock_auth" -H "Content-Type: application/json" -d '{"userId": "<user_id>"}'
```
in response you'll have `{'token': <token>}` valid for 24 hours
```
export API_AUTH_TOKEN=<token>
```

2. Generate a signed URL for uploading a training archive:
```
curl -X GET "https://api-service-923310519975.us-central1.run.app/upload_archive_url" -H "Authorization: Bearer $API_AUTH_TOKEN"'
```
In response you'll have `{'uploadUrl': <url>, 'targetId': <target_id>}`

3. Upload a training archive to the signed URL.
```
curl -X PUT -H 'Content-Type: application/octet-stream' --upload-file <your_file> '<uploadUrl>'
```

4. Start training
You'll need to pass targetId (returned in the step 2.) and targetName (specified by user).
```
curl -X POST "https://api-service-923310519975.us-central1.run.app/start_training" -H "Authorization: Bearer $API_AUTH_TOKEN" -H "Content-Type: application/json" -d '{"targetId": "<target_id>", "targetName": "<target_name>"}'
```

5. Check training status for all targets
```
curl -X GET "https://api-service-923310519975.us-central1.run.app/get_targets" -H "Authorization: Bearer $API_AUTH_TOKEN"
```
In response you'll have a list of all targets with their statuses.
## Test image generation

1. Authorize with the API service:
```
curl -X POST "https://api-service-923310519975.us-central1.run.app/mock_auth" -H "Content-Type: application/json" -d '{"userId": "<user_id>"}'
```
in response you'll have `{'token': <token>}` valid for 24 hours
```
export API_AUTH_TOKEN=<token>
```

2. Pick a targetId
```
curl -X GET "https://api-service-923310519975.us-central1.run.app/get_targets" -H "Authorization: Bearer $API_AUTH_TOKEN"
```
returns a list of all targets

3. Initialize a generation
```
curl -X POST "https://api-service-923310519975.us-central1.run.app/image_generation" -H "Authorization: Bearer $API_AUTH_TOKEN" -H "Content-Type: application/json" -d '{"targetId": "<target_id>", "imagePrompt": "<image_prompt>"}'
```
in response you'll have `{'generationId': <generation_id>}`

4. Check generation status
```
curl -X GET "https://api-service-923310519975.us-central1.run.app/get_generations" -H "Authorization: Bearer $API_AUTH_TOKEN"
```
In response you'll have a list of all generations with their statuses.

## Local testing setup

Set up envs:
```
export JWT_SECRET=random_string
export TELEGRAM_BOT_TOKEN=random_string
export GOOGLE_APPLICATION_CREDENTIALS=path/to/your/credentials.json # from firebase console
```

For local development, you can also set up firebase access locally:
```
const firebase = require('firebase-admin');
const { applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

firebase.initializeApp({
  credential: applicationDefault(),
  databaseURL: 'https://generations-db.firebaseio.com',
});
const firestore = getFirestore('generations-db');

module.exports = { firebase, firestore };
```