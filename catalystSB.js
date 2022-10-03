const { Command } = require('commander');
const program = new Command();

program
  .name('catalystSB')
  .version('0.0.1')
  .description('Catalyst Supabase Manager')
  .command('ping [options]', 'Ping the Catalyst Supabase', { executableFile: './catalystSB-ping.js' })
  .command('push [options]', 'Push data from remote repositories to Catalyst supabase', { executableFile: './catalystSB-push.js' });

program.parse(process.argv);