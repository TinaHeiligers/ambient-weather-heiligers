#!/bin/zsh
# NOT USED
source $HOME/.zshrc
cd /Users/Tina/Projects/ambient-weather-heiligers
/Users/Tina/.nvm/versions/node/v16.13.1/bin/node runFetchRawData.js && /Users/Tina/.nvm/versions/node/v16.13.1/bin/node runConvertImperialToJsonl.js && /Users/Tina/.nvm/versions/node/v16.13.1/bin/node runConvertImperialToMetric.js
