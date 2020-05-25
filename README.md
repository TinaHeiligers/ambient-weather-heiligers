The historic data is saved to gilbert_daily_data_historic index with index pattern of the same name. The template and alias setup didn't work as wanted to save the index to an alias.
What I want to do is save all the data to rolling indexes that map to index patterns using an alias.
The data is already in ES, so just fix it from here
The modify filebeat and logstash to use a similar setup as for the dark sky data.


## TODO:
Fix date
Add same logstash filters as used for the PE data, they work!
Wrangle the data to make sense of it
