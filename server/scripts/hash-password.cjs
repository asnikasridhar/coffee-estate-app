const { pbkdf2Sync, randomBytes } = require('node:crypto');

const password=process.argv[2];
if(!password){
  console.error('Usage: node server/scripts/hash-password.cjs "new strong password"');
  process.exit(1);
}
const iterations=210000,salt=randomBytes(16);
const hash=pbkdf2Sync(password,salt,iterations,32,'sha256');
console.log(`pbkdf2$${iterations}$${salt.toString('hex')}$${hash.toString('hex')}`);
