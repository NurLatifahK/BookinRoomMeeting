const { spawn } = require('child_process');
const path = require('path');

console.log('===========================================================');
console.log('🏦 Starting Bank Raya Meeting Room Booking System...');
console.log('===========================================================');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// 1. Start Server
const server = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(__dirname, 'server'),
  shell: true,
  env: { ...process.env, FORCE_COLOR: '1' }
});

server.stdout.on('data', (d) => process.stdout.write(`[SERVER] ${d}`));
server.stderr.on('data', (d) => process.stderr.write(`[SERVER ERR] ${d}`));

// 2. Start Client
const client = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(__dirname, 'client'),
  shell: true,
  env: { ...process.env, FORCE_COLOR: '1' }
});

client.stdout.on('data', (d) => process.stdout.write(`[CLIENT] ${d}`));
client.stderr.on('data', (d) => process.stderr.write(`[CLIENT ERR] ${d}`));

const cleanup = () => {
  console.log('\nStopping services...');
  if (isWindows) {
    if (server.pid) {
      try { require('child_process').execSync(`taskkill /pid ${server.pid} /T /F`); } catch (e) {}
    }
    if (client.pid) {
      try { require('child_process').execSync(`taskkill /pid ${client.pid} /T /F`); } catch (e) {}
    }
  } else {
    if (server.pid) server.kill();
    if (client.pid) client.kill();
  }
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
