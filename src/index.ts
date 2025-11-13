#!/usr/bin/env node
// src/index.ts
import { parseArgs } from 'node:util';
import { init } from './cli/init.js';
import { version } from './cli/version.js';
import { printHelp } from './cli/help.js';
import { main } from './main.js';


process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught exception:', error);
});

process.on('unhandledRejection', (error: Error | unknown) => {
  console.error('❌ Unhandled rejection:', error);
});

interface CliOptions {
  init?: boolean;
  help?: boolean;
  version?: boolean;
}

let values: CliOptions;

try {
  const args = parseArgs({
    options: {
      init: { type: 'boolean', short: 'i' },
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
    },
  });
  values = args.values as CliOptions;
} catch (err) {
  console.error('❌ Unrecognized argument. For help, run `bnbchain-mcp --help`.');
  process.exit(1);
}

if (values.help) {
  printHelp();
  process.exit(0);
}

if (values.version) {
  console.log(version);
  process.exit(0);
}

if (values.init) {
  await init(); // run init.js logic
} else {
  main().catch((error: Error) => {
    console.error('❌ Fatal error in main():', error);
    process.exit(1);
  });
}
