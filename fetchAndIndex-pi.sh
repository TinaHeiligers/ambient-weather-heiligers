#!/bin/bash
source /home/pi/.bashrc
cd /home/pi/Projects/ambient-weather-heiligers
echo $PWD
echo "===================="
echo date
/home/pi/.config/nvm/versions/node/v16.13.1/bin/node runMainIIFE.js
