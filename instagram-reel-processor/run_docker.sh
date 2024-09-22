#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo ".env file not found"
    exit 1
fi

# Check if running on ARM64 (M1/M2 Mac)
if [ "$(uname -m)" = "arm64" ]; then
    PLATFORM="--platform linux/amd64"
else
    PLATFORM=""
fi

# Build the Docker image
docker build $PLATFORM -t lambda-function .

# Run the Docker container
docker run --rm $PLATFORM \
  -e INSTAGRAM_USERNAME=$INSTAGRAM_USERNAME \
  -e INSTAGRAM_PASSWORD=$INSTAGRAM_PASSWORD \
  -v "$(pwd)":/var/task \
  lambda-function