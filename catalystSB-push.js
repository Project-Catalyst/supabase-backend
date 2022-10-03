const CATALYST_API_MODULE = './catalystSB-api.mjs'

const { Command } = require('commander');
const program = new Command();
program
  .description('Push data from Catalyst Repositories to Catalyst Supabase database.')
  .requiredOption('-f, --fund <fundNumber>', 'catalyst Fund number reference to push data', 9);
program.parse(process.argv);


/** getChallengesData
 * Axios get request to the challenges.json file in the Voter-Tool repository:
 * https://github.com/Project-Catalyst/voter-tool/tree/master/public/data/f${fundNumber}
 * @param {integer} fundNumber 
 * @returns {challengesObj}
 */
async function getChallengesData(fundNumber) {
  console.log("... axios request to Catalyst Voter Tool repository data")
  let data;
  const axios = require('axios');
  try {
    const resp = await axios.get(`https://raw.githubusercontent.com/Project-Catalyst/voter-tool/master/public/data/f${fundNumber}/challenges.json`);
    data = resp.data;
  } catch (error) {
    console.log(`!! Error requesting from Catalyst Voter Tool repository:`, error)
    throw new Error("Error requesting from Catalyst Voter Tool repository.")
  }
  return data
}


/** CATALYST SUPABASE API FUCTIONS
 * 
 * Functions to access Catalyst Supabase API endpoints
 * through the process of Pushing data regarding a specific Fund to the Catalyst Supabase tables.
 * 
 * The following functions use the supabase-createClient from CATALYST_API_MODULE
 * to request or insert data. 
 * 
 */


/** getAllFundsNumbers
 * Get all the fundNumbers existing on Catalyst Supabase Funds Table.
 * @returns [<integers>]
 */
async function getAllFundsNumbers() {
  console.log(`... connecting with catalystSB-api < getAllFundsNumbers >`)
  let {supabase} = await import(CATALYST_API_MODULE);
  const { data, error } = await supabase
    .from('Funds')
    .select('number')
  
    if(error) { 
    console.log(`!! Error requesting from Catalyst Supabase Funds: `, error)
    throw new Error("Error requesting from Catalyst Supabase Funds Table")
  } 
  return data.map( (f) => f.number )
} 

/** getFundByNumber
 * Get the Fund row object from Catalyst Supabase Funds Table related to the fundNumber provived.
 * @param {integer} fundNumber 
 * @returns {fundRowObj}
 */
async function getFundByNumber(fundNumber) {
  console.log(`... connecting with catalystSB-api < getFundByNumber(${fundNumber}) >`)
  let {supabase} = await import(CATALYST_API_MODULE);
  const { data, error } = await supabase
    .from('Funds')
    .select("*")
    .eq('number', fundNumber)
  
  if(error) { 
    console.log(`!! Error requesting from Catalyst Supabase Funds: `, error)
    throw new Error("Error requesting from Catalyst Supabase Funds Table")
  } 
  else if (data.length === 0) {
    console.log(`!! Catalyst Supabase Table-Fund${fundNumber} do not exist.`)
    throw new Error(`Catalyst Supabase Fund${fundNumber} record not found.`)
  }
  else if (data.length > 1) {
    console.log(`!! Warning: more than one Fund${fundNumber} record identified. Used the first record returned.`)
  }
  return data[0]
}

/** supabaseInsert
 * Insert the < inserData > on the Catalyst Supabase Table-< table >
 * @param {string} table 
 * @param {Array} insertData 
 * @returns 
 */
async function supabaseInsert(table, insertData) {
  console.log("... connecting with catalystSB-api for data insertion")
  let {supabase} = await import(CATALYST_API_MODULE);
  const { data, error } = await supabase
    .from(table)
    .insert(insertData)
  if(error) { 
    console.log(`!! Error inserting Catalyst Supabase ${table}: `, error)
    throw new Error(`Error requesting from Catalyst Supabase ${table} Table`)
  } else {
    console.log(`> insert >> Catalyst Supabase Table-${table} ${data.length} records inserted.`)
  }
  return
}


/** PUSH PIPELINE FUNCTIONS
 * 
 * Functions to composing the code pipeline to 
 * Pushing data regarding a specific Fund to the Catalyst Supabase tables.
 *  
 */


/** insertTblFunds
 * Insert the Fund-<fundNumber> data as a row to the Catalyst Supabase Funds Table.
 * @param {integer} fundNumber 
 * @returns 
 */
async function insertTblFunds(fundNumber) {
  console.log('\n>> INSERT TBL-Funds DATA:')
  let allFundsNumbers = await getAllFundsNumbers()
  if ( !allFundsNumbers.includes(fundNumber) ) {
    let data = [
      {
        title: `Fund ${fundNumber}`,
        number: parseInt(fundNumber)    
      }]
    await supabaseInsert("Funds", data)
  }
  else { console.log(`> insert >> TBL-Funds already contains Fund-${fundNumber} data`) }
  return
}

/** insertTblChallenges
 * Insert the Challenge's data regarding Fund-<fundNumber> to the Catalyst Supabase Challenges Tables.
 * The data information for Challenges is fetched from the Voter-Tool Repository.
 * @param {integer} fundNumber 
 */
async function insertTblChallenges(fundNumber) {
  console.log('\n>> INSERT TBL-Challenges DATA:')
  let challenges = await getChallengesData(fundNumber)
  let fund = await getFundByNumber(fundNumber);
  let insertData = challenges.map( (ch) => (
    {
      internal_id: ch.id,
      title: ch.title,
      brief: ch.description,
      budget: ch.amount,
      currency: "$",
      fund_id: fund.id
    }
  ))
  await supabaseInsert("Challenges", insertData)
}

async function insertTblProposals() {
  console.log('>> INSERT TBL-Proposals DATA:')

}


async function pushFundData(fundNumber) {
  console.log(`=============================\n CALL TO < pushFundData(${fundNumber}) >\n=============================`)
  fundNumber = parseInt(fundNumber)
  
  await insertTblFunds(fundNumber)
  await insertTblChallenges(fundNumber)
  // await insertTblProposals()

}

pushFundData(program.opts().fund)