const [major, minor] = process.versions.node.split('.').map(Number);
const supported = major > 22 || (major === 22 && minor >= 12);

if (!supported) {
  console.error(`No Brakes requires Node.js 22.12.0 or newer; found v${process.versions.node}. Install/select Node 22, restart VS Code, then run npm install from src/.`);
  process.exit(1);
}
