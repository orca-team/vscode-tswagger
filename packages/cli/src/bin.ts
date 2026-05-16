import { runCli } from './index';

runCli(process.argv.slice(2)).catch((error) => {
  console.error(`[tswagger-cli] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});