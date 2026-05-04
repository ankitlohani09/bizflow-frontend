import bcrypt from 'bcryptjs';
const password = 'password123';
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);
console.log('Plain:', password);
console.log('Hash :', hash);
console.log('Length:', hash.length);
