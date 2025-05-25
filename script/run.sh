#!/bin/bash

name="$1"
output=$(npm run "$name" 2>&1)
exit_code=$?

echo "===== $name COMMAND EXIT CODE ====="
echo "$exit_code"
echo "===== $name COMMAND OUTPUT ====="
echo "$output"
