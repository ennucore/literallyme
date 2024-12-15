# Check Training

When generation workflow is started, the `check-training` function is called to check if the training workflow has completed. 
If so, the lora weights are fetched and returned to the generation workflow via callback.
If not, callback URL will be written to database and called once training is complete in `training-hook`.



