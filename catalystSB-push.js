const CATALYST_API_MODULE = './catalystSB-api.mjs'
const OPTIONS = require('./options.json')

const axios = require('axios');
const csvParser = require('csvtojson');

/**
 * CMD INSTANTIATION
 */
const { Command } = require('commander');
const program = new Command();
program
  .description('Push an entire Fund data to the Catalyst Supabase tables.')
  .requiredOption('-f, --fund <fundNumber>', 'catalyst Fund number reference to push data', 9);
program.parse(process.argv);


/********************************************
    CATALYST REPOSITORIES FETCH FUNCTIONS
 ******************************************** 
 *
 * Functions to fetch data from different Catalyst Github repositories
 * to recover data to be processed and futher pushed to Catalyst Supabase tables.
 *  
 */

function spliceIntoChunks(arr, chunkSize=1000) {
  const res = [];
  while (arr.length > 0) {
      const chunk = arr.splice(0, chunkSize);
      res.push(chunk);
  }
  return res;
}

function getPath(fileRef, fundNumber) {
  if(fileRef==='challenges') {
    return OPTIONS.CHALLENGES_URL.replace("${fundNumber}", String(fundNumber))
  }
  else if(fileRef==='proposals_pa') {
    return OPTIONS.PROPOSALS_URL_PA.replace("${fundNumber}", String(fundNumber))
  }
  else if(fileRef==='proposals_vpa') {
    return OPTIONS.PROPOSALS_URL_VPA
  }
  else if (fileRef==='assessments') {
    return OPTIONS.ASSESSMENTS_PATH
  }
  else {
    throw new Error(`Error on Catalyst data path: fileRef=${fileRef} does not exist. Select from fileRef=["challenges", "proposals", "assessments"]`)
  }
}

/** fetchChallengesData
 * Axios get request to the challenges.json file in the Voter-Tool repository.
 * Path configuration is provided on OPTIONS.CHALLENGES_URL
 * @param {integer} fundNumber 
 * @returns {challengesObj}
 */
async function fetchChallengesData(fundNumber) {
  console.log("... axios request to < challenges.json > on Catalyst Voter Tool repository")
  let data;
  try {
    const resp = await axios.get(getPath('challenges', fundNumber));
    data = resp.data;
  } catch (error) {
    console.log(`!! Error requesting from Catalyst Voter Tool repository:`, error)
    throw new Error("Error requesting from Catalyst Voter Tool repository.")
  }
  return data
}

/** fetchProposalsData
 * Axios get request to the proposals.json file in the PA-Tool repository.
 * Path configuration is provided on OPTIONS.PROPOSALS_URL
 * @param {integer} fundNumber 
 * @returns {proposalsObj}
 */
 async function fetchProposalsData(fundNumber, repo='pa') {
  console.log("... axios request to < proposals.json > on Catalyst PA-Tool repository")
  let data;
  try {
    const resp = await axios.get(getPath(`proposals_${repo}`, fundNumber));
    data = resp.data;
  } catch (error) {
    console.log(`!! Error requesting from Catalyst Voter Tool repository:`, error)
    throw new Error("Error requesting from Catalyst Voter Tool repository.")
  }
  return data
}

/** fetchAssessmentsData
 * Axios get request to the assessments.csv file related to the VPA-Tool repository.
 * The file is loaded from local storage. Path configuration is provided on OPTIONS.ASSESSMENTS_PATH
 * @param {integer} fundNumber 
 * @returns {proposalsObj}
 */
 async function fetchAssessmentsData(fundNumber) {
  console.log("... loading < assessments.csv > from local storage < options.json.assessments_path >")
  const data = await csvParser().fromFile(getPath('assessments', fundNumber));
  return data
}

/************************************
    CATALYST SUPABASE API FUCTIONS
 ************************************ 
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
    console.log(error)
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
    console.log(error)
    throw new Error("Error requesting from Catalyst Supabase Funds Table")
  } 
  else if (data.length === 0) {
    throw new Error(`Catalyst Supabase Fund${fundNumber} record not found.`)
  }
  else if (data.length > 1) {
    console.log(`!! Warning: more than one Fund${fundNumber} record identified. Used the first record returned.`)
  }
  return data[0]
}

/** getChallengesByFund
 * Get the Fund row object from Catalyst Supabase Funds Table related to the fundNumber provived.
 * @param {fundObj} fund
 * @returns {challengesObj}
 */
 async function getChallengesByFund(fund) {
  console.log(`... connecting with catalystSB-api < getChallengesByFund(${fund.number}) >`)
  let {supabase} = await import(CATALYST_API_MODULE);
  const { data, error } = await supabase
    .from('Challenges')
    .select("*")
    .eq('fund_id', fund.id)
  
  if(error) { 
    console.log(error)
    throw new Error("Error requesting from Catalyst Supabase Challenges Table")
  } 
  else if (data.length === 0) {
    throw new Error(`Catalyst Supabase Challenges fund_id=${fund.number} records not found.`)
  }
  return data
}

/** getProposalsByFund
 * Get the Proposal row object from Catalyst Supabase Proposals Table related to the Proposals.internal_id provived.
 * @param {fundObj} fund 
 * @returns {proposalsObj}
 */
 async function getProposalsByFund(fund) {
  console.log(`... connecting with catalystSB-api < getProposalsByFund(${fund.number}) >`)
  let {supabase} = await import(CATALYST_API_MODULE);
  const { data, error } = await supabase
    .from('Proposals')
    .select("*")
    .eq('fund_id', fund.id)
  
  if(error) { 
    console.log(error)
    throw new Error("Error requesting from Catalyst Supabase Proposals Table")
  } 
  else if (data.length === 0) {
    throw new Error(`Catalyst Supabase Proposals fund_id=${fund.number} records not found.`)
  }
  return data
}

/** getAssessors
 * 
 * @returns 
 */
async function getAssessors() {
  console.log(`... connecting with catalystSB-api < getAssessors() >`)
  let {supabase} = await import(CATALYST_API_MODULE);
  const { data, error } = await supabase
    .from('Assessors')
    .select("*")
  
  if(error) { 
    console.log(error)
    throw new Error("Error requesting from Catalyst Supabase Assessors Table")
  } 
  else if (data.length === 0) {
    throw new Error(`Catalyst Supabase Assessors records not found.`)
  }
  return data
}

/** supabaseInsert
 * Insert the < inserData > on the Catalyst Supabase Table-< table >
 * @param {string} table 
 * @param {Array} insertData 
 * @returns 
 */
async function supabaseInsert(table, insertData, chunk=false) {
  let {supabase} = await import(CATALYST_API_MODULE);
  const { data, error } = await supabase
    .from(table)
    .insert(insertData)
  if(error) { 
    console.log(error)
    throw new Error(`Error requesting from Catalyst Supabase ${table} Table (chunk=${chunk})`)
  } else {
    console.log(`> insert >> Catalyst Supabase Table-${table} ${data.length} records inserted (chunk=${chunk}).`)
  }
  return
}


/******************************
    PUSH PIPELINE FUNCTIONS
 ****************************** 
 *
 * Functions to composing the code pipeline to 
 * Pushing data regarding a specific Fund to the Catalyst Supabase tables.
 *  
 */


async function pushData(table, insertData) {
  if(insertData.length > 1500) {
    console.log(`!! large data input (#${insertData.length})`)
    let chunckData = spliceIntoChunks(insertData)
    console.log(`... splice into #${chunckData.length} chunks`)
    console.log("... connecting with catalystSB-api for data insertion")
    for (const [ck_index, ck] of chunckData.entries()) {
      await supabaseInsert(table, ck, ck_index)
    }
  }
  else {
    console.log("... connecting with catalystSB-api for data insertion")
    await supabaseInsert(table, insertData)
  }
}

/** pushTblFunds
 * Insert the Fund-<fundNumber> data as a row to the Catalyst Supabase Funds Table.
 * @param {integer} fundNumber 
 * @returns 
 */
async function pushTblFunds(fundNumber) {
  console.log('\n>> INSERT TBL-Funds DATA:')
  let allFundsNumbers = await getAllFundsNumbers()
  if ( !allFundsNumbers.includes(fundNumber) ) {
    let data = [
      {
        title: `Fund ${fundNumber}`,
        number: parseInt(fundNumber)    
      }]
    await pushData("Funds", data)
  }
  else { console.log(`> insert >> TBL-Funds already contains Fund-${fundNumber} data`) }
  return
}

/** pushTblChallenges
 * Insert the Challenge's data regarding Fund-<fundNumber> to the Catalyst Supabase Challenges Tables.
 * The data information for Challenges is fetched from the Voter-Tool Repository.
 * @param {integer} fundNumber 
 */
async function pushTblChallenges(fundNumber, fund) {
  console.log('\n>> INSERT TBL-Challenges DATA:')
  let challenges = await fetchChallengesData(fundNumber)
  let chSettingRegex = /Fund\d*\s*[Cc]hallenge\s*[Ss]etting/;
  let insertData = challenges.map( (ch) => {
    let isChallengeSetting;
    (ch.title.match(chSettingRegex))
    ? isChallengeSetting = true
    : isChallengeSetting = false;
    return {
      internal_id: ch.id,
      title: ch.title,
      brief: ch.description,
      budget: ch.amount,
      currency: "$",
      url: ch.url,
      challenge_setting: isChallengeSetting,
      fund_id: fund.id
    }
  })
  await pushData("Challenges", insertData)
}

/** pushTblProposals
 * 
 * @param {*} fund 
 * @param {*} challenges 
 */
async function pushTblProposals(fund, challenges) {
  console.log('\n>> INSERT TBL-Proposals DATA:')

  let proposals = await fetchProposalsData(fund.number)
  let insertData = proposals.map( (p) => {
    let challenge = challenges.filter( (ch) => ch.internal_id===p.category )[0];
    return {
      internal_id: p.id,
      title: p.title,
      url: p.url,
      author: p.author,
      problem_statement: p.description,
      problem_solution: (p.hasOwnProperty('how_does_success_look_like_')) ? p.how_does_success_look_like_ : p.problem_solution,
      relevant_experience: (p.hasOwnProperty('importance')) ? p.importance : p.relevant_experience,
      budget: p.requested_funds,
      currency: "$",
      tags: p.tags,
      challenge_id: challenge.id,
      fund_id: fund.id
    }
  })
  await pushData("Proposals", insertData)
}

/** pushTblAssessors
 * 
 * @param {*} assessments 
 */
async function pushTblAssessors(assessments) {
  console.log('\n>> INSERT TBL-Assessors DATA:')
  let anon_unique_ids = [... new Set(assessments.map( p => p.Assessor))]
  let insertData = anon_unique_ids.map( (anonId) => (
    {
      anon_id: anonId
    }
  ))
  await pushData("Assessors", insertData)
}

async function pushTblAssessorsFunds(assessors, fund) {
  console.log('\n>> INSERT TBL-AssessorsFunds DATA:')

  let insertData = assessors.map( (ass) => (
    {
      assessor_id: ass.id,
      fund_id: fund.id,
    }
  ))
  await pushData("AssessorsFunds", insertData)
}

/** pushTblAssessments
 * 
 * @param {*} fund 
 * @param {*} challenges 
 * @param {*} proposals 
 * @param {*} assessments 
 * @param {*} assessors 
 */
async function pushTblAssessments(fund, challenges, proposals, assessments, assessors) {
  console.log('\n>> INSERT TBL-Assessments DATA:')

  let insertData = assessments.map( (ass) => { 
    let matchProposals = proposals.filter( (p) => p.internal_id===parseInt(ass["proposal_id"]) );

    return {
      assessor_id: assessors.filter( (a) => a.anon_id===ass["Assessor"] )[0].id,
      proposal_id: (matchProposals.length === 0) ? null : matchProposals[0].id,
      challenge_id: challenges.filter( (ch) => ch.internal_id===parseInt(ass["challenge_id"]) )[0].id,
      fund_id: fund.id,
      vpas_reviews: 0,
      impact_note: ass["Impact / Alignment Note"],
      impact_rating: parseInt(ass["Impact / Alignment Rating"]),
      feasibility_note: ass["Feasibility Note"],
      feasibility_rating: parseInt(ass["Feasibility Rating"]),
      auditability_note: ass["Auditability Note"],
      auditability_rating: parseInt(ass["Auditability Rating"]),
      rating_avg: (parseInt(ass["Impact / Alignment Rating"])+parseInt(ass["Feasibility Rating"])+parseInt(ass["Auditability Rating"]))/3,
      notes_len: ass["Impact / Alignment Note"].length + ass["Feasibility Note"].length + ass["Auditability Note"].length,
      proposer_mark: ass["Proposer Mark"],
      proposer_filteredout: ass["Proposer Filtered Out rationale or Feedback"],
      rating_excellent: ass["Excellent"],
      rating_good: ass["Good"],
      rating_filteredout: ass["Filtered Out"],
      vpa_feedback: ass ["vPA Feedback"],
      blank: (ass["Blank"] === "") ? false : ass["Blank"]
    }
  })
  await pushData("Assessments", insertData)
}


async function pushFundData(fundNumber) {
  console.log(`=============================\n CALL TO < pushFundData(${fundNumber}) >\n=============================`)
  fundNumber = parseInt(fundNumber)

  // await pushTblFunds(fundNumber)
  let fund = await getFundByNumber(fundNumber);

  // await pushTblChallenges(fundNumber, fund)
  let challenges = await getChallengesByFund(fund)

  // await pushTblProposals(fund, challenges)
  let proposals = await getProposalsByFund(fund)

  let assessmentsData = await fetchAssessmentsData()

  // await pushTblAssessors(assessmentsData) // add fund, challenge and proposals to populate ref columns
  let assessors = await getAssessors()

  // await pushTblAssessorsFunds(assessors, fund)

  await pushTblAssessments(fund, challenges, proposals, assessmentsData, assessors)

}

pushFundData(program.opts().fund)
