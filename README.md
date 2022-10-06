# supabase-backend
**Repository responsible for constructing and managing the Supabase Catalyst database -- CatalystSB.**

The CatalystSB database is currently composed by five tables:
- Funds
- Challenges
- Proposals
- Assessors
- Assessments

The `catalystSB.js` file provides cmd functionality to verify connection and manipulate the database.

```
Usage: catalystSB [options] [command]

Catalyst Supabase Manager

Options:
  -V, --version   output the version number
  -h, --help      display help for command

Commands:
  ping [options]  Ping the Catalyst Supabase
  push [options]  Push data from remote repositories to Catalyst supabase
  help [command]  display help for command
```

### `catalystSB push` command
```
Usage: catalystSB-push [options]

Push an entire Fund data to the Catalyst Supabase tables.

Options:
  -f, --fund <fundNumber>  catalyst Fund number reference to push data (default: 9)
  -h, --help               display help for command
```
The `push` command is responsible for populating the CatalystSB tables with the data related to the `-- fund` option.
Raw data is collected from [Project-Catalyst Github repositories](https://github.com/Project-Catalyst) and local files and processed to the CatalystSB tables format.
The pipeline sequentially populates the tables `Funds > Challenges > Proposals > Assessors > Assessments` with proper configuration of foreign-keys relationships.

**Usage example:**
```
~cmd: node catalystSB.js push -f 9
```
_output:_
```
```

### `catalystSB ping` command
```
Usage: catalystSB-ping [options]

Check connection with Catalyst Supabase (required) Table

Options:
  -t, --table <tableName>  required table name to connect with
  -h, --help               display help for command
```
The `ping` command is simply to verify connection if a given CatalystSB table.
Data from  `tableName` is selected and it is provided the number of registers returned.

**Usage example:**
```
~cmd: node catalystSB.js ping -t Challenges
```
_output:_
```
... connecting with catalystSB-api
>> Catalyst Supabase Table-Challenges contains 13 records.
```
