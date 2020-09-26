#!/bin/bash
source $HOME/.bashrc
cd /home/pi/Projects/ambient-weather-heiligers
echo $PWD
echo "======================"
echo date
/home/pi/.config/nvm/versions/node/v14.4.0/bin/node runFetchRawData.js && /home/pi/.config/nvm/versions/node/v14.4.0/bin/node runConvertImperialToJsonl.js
