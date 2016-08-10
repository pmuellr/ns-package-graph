#!/usr/bin/env bash

# run's `npm run watch`, but under nsolid

echo "starting npm in the background"

NSOLID_APPNAME=npm-3 NSOLID_HUB=2379 nsolid /usr/local/lib/node_modules/npm/bin/npm-cli.js run wait &
PID_NPM=$!

sleep 1
echo "waiting a bit for things to settle"
sleep 3

echo ""
echo "here's what's running:"
echo ""
node ./ns-package-graph
echo ""

echo "generating images"
node ./ns-package-graph npm-3 -f dot  > images/npm-3.dot
node ./ns-package-graph npm-3 -f svg  > images/npm-3.svg
node ./ns-package-graph npm-3 -f html > images/npm-3.html
dot images/npm-3.dot -T png   -o images/npm-3.png
cp images/npm-3.dot images/npm-3.dot.txt

echo "killing npm process"
kill $PID_NPM
