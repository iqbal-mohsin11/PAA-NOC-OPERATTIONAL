/**
 * Windows Desktop Shortcut Creator Script
 * Creates a Desktop shortcut for PAA IT Inventory Management
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('----------------------------------------------------');
console.log('  PAA SENTINEL IT INVENTORY - DESKTOP SHORTCUT SETUP  ');
console.log('----------------------------------------------------');

try {
  const isWin = process.platform === 'win32';
  if (isWin) {
    const desktopPath = path.join(process.env.USERPROFILE || '', 'Desktop');
    const shortcutPath = path.join(desktopPath, 'PAA IT Inventory.lnk');
    const targetUrl = 'http://localhost:3000';

    const psCommand = `
$ws = New-Object -ComObject WScript.Shell
$s = $ws.CreateShortcut('${shortcutPath.replace(/\\/g, '\\\\')}')
$s.TargetPath = 'chrome.exe'
$s.Arguments = '--app=${targetUrl}'
$s.Description = 'Pakistan Airports Authority IT Asset & Logistics Inventory Management'
$s.Save()
`;

    execSync(`powershell -ExecutionPolicy Bypass -Command "${psCommand.replace(/\n/g, ' ')}"`, { stdio: 'inherit' });
    console.log(' [SUCCESS] Installation done! Shortcut created on Desktop:');
    console.log(` -> ${shortcutPath}`);
  } else {
    console.log(' [INFO] Platform is not Windows. Desktop shortcut script generated for Windows deployment.');
  }
} catch (err) {
  console.error(' [ERROR] Could not create shortcut directly:', err.message);
}
