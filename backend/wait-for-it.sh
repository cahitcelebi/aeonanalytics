#!/bin/sh
#   Use this script to test if a given TCP host/port are available

# The MIT License (MIT)
# Copyright (c) 2016 vishnubob
# https://github.com/vishnubob/wait-for-it

set -e

HOST="$1"
PORT="$2"
shift 2

for i in $(seq 1 60); do
  if nc -z "$HOST" "$PORT"; then
    echo "Host $HOST:$PORT is available!"
    exec "$@"
    exit 0
  fi
  echo "Waiting for $HOST:$PORT... ($i/60)"
  sleep 1
done

echo "Timeout waiting for $HOST:$PORT"
exit 1 