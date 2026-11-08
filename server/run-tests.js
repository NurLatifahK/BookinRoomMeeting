const { spawn } = require('child_process');
const path = require('path');

async function main() {
  console.log('Starting server in background for testing...');
  const isWindows = process.platform === 'win32';
  const npmCmd = isWindows ? 'npm.cmd' : 'npm';
  const npxCmd = isWindows ? 'npx.cmd' : 'npx';

  const serverProc = spawn(npmCmd, ['run', 'dev'], {
    cwd: __dirname,
    shell: true,
    stdio: 'pipe',
  });

  serverProc.stdout.on('data', (d) => {
    // console.log(`[server] ${d.toString()}`);
  });

  serverProc.stderr.on('data', (d) => {
    // console.error(`[server err] ${d.toString()}`);
  });

  // Wait 4 seconds for server to start
  await new Promise((res) => setTimeout(res, 4000));

  console.log('Running e2e test suite...');
  const testProc = spawn(npxCmd, ['tsx', 'test-e2e.ts'], {
    cwd: __dirname,
    shell: true,
    stdio: 'inherit',
  });

  testProc.on('exit', (code) => {
    console.log(`Test exited with code ${code}. Stopping server...`);
    serverProc.kill('SIGKILL');
    process.exit(code || 0);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

