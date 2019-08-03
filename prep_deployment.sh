#!/bin/bash

echo "Removing old static files"
rm -r ./static/js
rm -r ./static/css


echo "Building app..."
npm run build

echo "Copying built files from dist into current directory"
cp -r ./dist/** .

echo "Done!"
