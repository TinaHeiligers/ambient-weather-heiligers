## Warning
Use at your own risk!
This project is in progress and by no means do I declare it to be 'prod-ready'.

## Ambient Weather Heiligers (weather station data)
The data is will be indexed into ambient_weather_heiligers_imperial and ambient_weather_heiligers_metric indices with index patterns of the same name. The templates and aliases are versioned in the config folder.
The data comes from my own weather station, mounted on my patio roof, just outside my office.

## Duplicate data
There's a high chance of duplicate entries because of the way the Ambient Weather REST API works (counting records backwards in time). Any duplicate data entries are removed with Logstash during a reindexing operation.

## Scripts:
Install:
`$npm install`

To fetch and convert data:
1. Fetch new data:
`$node runFetchRawData.js`

2. Convert imperial data to jsonl:
`$node runConvertImperialToJsonl.js`

3. Handle metric and json -> jsonl conversion
`$node runConvertImperialToMetric.js`

This does not work:
`$npm start` or `$ ./fetchdata.sh`

Test:
`$npm test`

### Where the code lives:
 - runFetchNewData.js (class)
 - runConvertImperialToJsonl.js

 **Not currently in use**
 - convert_imperial_to_metric.js
 - metric-data-to_jsonl.js

## ELasticsearch info

### Reindexing and Aliases:
Updating mappings for fields that already exist can only be done by reindexing with the new, updated mapping.
There's a great desciption given in [a blog post describing the process](https://www.objectrocket.com/blog/elasticsearch/elasticsearch-aliases/):
>After reindexing, you still have to manage the cutover from the old index to the new index. Aliases allow you to make this cutover without downtime.<br></br> Here’s how:<br></br>_Let’s assume I have an index called oldIndex and I want to reindex it into newIndex._
<br></br>1. The first thing I want to do is create an alias (myalias) and add it to oldIndex.
<br></br>2. Next, make sure that your application is pointing to myalias rather than oldIndex.
<br></br>3. Now create your new index, newIndex, and begin reindexing the data from oldIndex into it.
<br></br>4. Add newIndex to ‘myalias’ and remove oldIndex. You can do this in a single command and the change is atomic, so there will be no issues during the transition.
```
POST /_aliases
{
    "actions" : [
        { "remove" : { "index" : "oldIndex", "alias" : "myalias" } },
        { "add" : { "index" : "newIndex", "alias" : "myalias" } }
    ]
}
```
<br></br>5. Verify that you’re getting the results you expect with the alias and then you can remove *oldIndex* when you’re ready.
<br></br>Note: It’s good practice to use an alias for reads/queries from your application anyway, so if you did that from the get-go, you’d have been able to skip the first three steps in that reindexing process.

## TODO:
- ~~Delete duplicate entries: https://www.elastic.co/blog/how-to-find-and-remove-duplicate-documents-in-elasticsearch~~ Current solution is to use logstash
- automate test runs before pushing to Github
- set up CI
- refactor metric conversion to class
- add new classes to their own call modules
- implement using es client to index without filebeat
- automate de-duping entries

## Known bugs:
 - If the last saved data file is an empty array, the rawDataFatcher doesn't fetch new data.
 - ~~still valid? if there aren't any files in the `ambient-weather-heiligers-data` folder, `getLastRecordedDataDate` throws an error.~~

## Current aliases:
| alias | index | filter | routing.index | routing.search | is_write_index (if blank, defaults to true) |
| ----------- | ----------- | ----------- | ----------- | ----------- | ----------- |
| all-deduped-ambient-weather-heiligers-imperial | deduped_ambient_weather_heiligers_imperial_2020_07_25 - | - | - | - |
| all-ambient-weather-heiligers-imperial | ambient_weather_heiligers_imperial_2020_09_12 | - | - | - | false |
| all-ambient-weather-heiligers-metric | ambient_weather_heiligers_metric_2020_12_31 | - | - | - | true |
| all-ambient-weather-heiligers-imperial | ambient_weather_heiligers_imperial_2020_08_03 | - | - | - | false |
| all-ambient-weather-heiligers-imperial | ambient_weather_heiligers_imperial_2020_06_30 | - | - | - | false |
| all-ambient-weather-heiligers-metric | ambient_weather_heiligers_metric_2020_09_27 | - | - | - | false |
| all-ambient-weather-heiligers-imperial | ambient_weather_heiligers_imperial_2020_12_31 | - | - | - | true |
