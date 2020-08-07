#!/bin/zsh
say "hello there"
source $HOME/.zshrc
cd /Users/Tina/Projects/ambient-weather-heiligers
say "about to run the fetch data script"
/Users/Tina/.nvm/versions/node/v12.18.0/bin/node runFetchRawData.js && /Users/Tina/.nvm/versions/node/v12.18.0/bin/node runConvertImperialToJsonl.js
