## Warning
Use at your own risk!
This project is in progress and by no means do I declare it to be 'prod-ready'.

## Scripts:
Install:
`$npm install`

Fetch new data:
`$node fetchNewData.js`

Convert imperial data to jsonl:
`$node convertImperialToJsonl.js`

Test:
`$npm test`

## Historic data from Dark Sky
The historic data is saved to gilbert_daily_data_historic index with index pattern of the same name. The template and alias setup didn't work as wanted to save the index to an alias.
What I want to do is save all the data to rolling indexes that map to index patterns using an alias.
The data is already in ES, so just fix it from here
The modify filebeat and logstash to use a similar setup as for the dark sky data.
### Where the code lives:
 - index.js
 - toJsonl.js


## Reindexing and Aliases:
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

## Ambient Weather Heiligers (weather station data)
The data is will be indexed into ambient_weather_heiligers_imperial and ambient_weather_heiligers_metric indices with index patterns of the same name. The template and alias still need to be defined/refined with an alias so that rollover can happen to a new index based on the same templates.
The data comes from my very own weather station, mounted on my porch roof, just outside my office.


### Where the code lives:
 - runFetchNewData.js (class)
 - runConvertImperialToJsonl.js

 **Not currently in use**
 - convert_imperial_to_metric.js
 - metric-data-to_jsonl.js

## Test branch: adding-elasticsearch-client
Includes install of `@elastic/elasticsearch (major: 7)

## Other solutions for sending data to ES
 - build filebeat from code
 - build logstash from code

## TODO:
- ~~Delete duplicate entries: https://www.elastic.co/blog/how-to-find-and-remove-duplicate-documents-in-elasticsearch~~ Current solution is to use logstash
- automate test runs before pushing to Github
- set up CI
- refactor metric conversion to class
- add new classes to their own call modules
- implement using es client to index without filebeat
- automate de-duping entries

## Known bugs:
 - still valid? if there aren't any files in the `ambient-weather-heiligers-data` folder, `getLastRecordedDataDate` throws an error.
