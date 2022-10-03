const { Command } = require('commander');
const program = new Command();
program
  .description('Check connection with Catalyst Supabase (required) Table')
  .requiredOption('-t, --table <tableName>', 'required table name to connect with');
program.parse(process.argv);


async function ping(table) {
  console.log("... connecting with catalystSB-api")
  let {supabase} = await import('./catalystSB-api.mjs');
  const { data, error } = await supabase
    .from(table)
    .select('*')
  if(error) { 
    console.log(`Error requesting Catalyst Supabase ${table}: `, error)
  } else {
    console.log(`>> Catalyst Supabase Table-${table} contains ${data.length} records.`)
  }
  return
}

ping(program.opts().table)