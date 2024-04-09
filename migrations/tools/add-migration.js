const execSync = require('child_process').execSync;

const arg = process.argv[2];

if (!arg) throw new Error('Pass the name for migration');

const command = `typeorm-ts-node-commonjs migration:generate  -d ./typeorm.config.ts ./migrations/${arg}`;

execSync(command, { stdio: 'inherit' });
