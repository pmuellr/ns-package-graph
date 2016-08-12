#!/usr/bin/env bash

# cd into this directory
cd "$(dirname "$0")"

echo "starting samples in the background"

NSOLID_APPNAME=sample_1 NSOLID_HUB=2379 nsolid sample_1/main.js &
PID_1=$!

NSOLID_APPNAME=sample_2 NSOLID_HUB=2379 nsolid sample_2/main.js &
PID_2=$!

sleep 1
echo "waiting a bit for things to settle"
sleep 3

echo ""
echo "here's what's running:"
echo ""
node ../ns-package-graph
echo ""

echo "generating images"
node ../ns-package-graph sample_1 -f dot   > sample_1/sample_1.dot
node ../ns-package-graph sample_1 -f svg   > sample_1/sample_1.svg
node ../ns-package-graph sample_1 -f html  > sample_1/sample_1.html
dot sample_1/sample_1.dot -T png          -o sample_1/sample_1.png

node ../ns-package-graph sample_2 -f dot   > sample_2/sample_2.dot
node ../ns-package-graph sample_2 -f svg   > sample_2/sample_2.svg
node ../ns-package-graph sample_2 -f html  > sample_2/sample_2.html
dot sample_2/sample_2.dot -T png          -o sample_2/sample_2.png

echo "killing samples"
kill $PID_1
kill $PID_2
