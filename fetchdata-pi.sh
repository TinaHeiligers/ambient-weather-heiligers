#!/bin/bash
# NOT USED
source /home/pi/.bashrc
cd /home/pi/Projects/ambient-weather-heiligers
echo $PWD
echo "======================"
echo date
/home/pi/.config/nvm/versions/node/v16.13.1/bin/node runFetchRawData.js && /home/pi/.config/nvm/versions/node/v16.13.1/bin/node runConvertImperialToJsonl.js && /home/pi/.config/nvm/versions/node/v16.13.1/bin/node runConvertImperialToMetric.js
