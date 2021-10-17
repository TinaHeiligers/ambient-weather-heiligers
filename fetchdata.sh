#!/bin/zsh
source $HOME/.zshrc
cd /Users/Tina/Projects/ambient-weather-heiligers
/Users/Tina/.nvm/versions/node/v14.17.0/bin/node runFetchRawData.js && /Users/Tina/.nvm/versions/node/v14.17.0/bin/node runConvertImperialToJsonl.js && /Users/Tina/.nvm/versions/node/v14.17.0/bin/node runConvertImperialToMetric.js
