#!/bin/bash

echo "Removing old static files"
rm -r ./static/js
rm -r ./static/css


echo "Building app..."
NODE_OPTIONS=--openssl-legacy-provider npm run start

echo "Copying built files from dist into current directory"
cp -r ./dist/** .

routes=("/about" "/experiences")
for route in ${routes[@]}; do
  echo $route
  mkdir -p "$(dirname "$0")$route/" && cp "$(dirname "$0")/index.html" "$_"
done

echo "Done!"
