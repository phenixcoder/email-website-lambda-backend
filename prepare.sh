#!/bin/bash

# export LAMBDA_TASK_ROOT=/var/task
SERVICE_NAME=$REPO_NAME

npm version $1 --no-git-tag-version
npm run build:image
docker build --no-cache -t $SERVICE_NAME .