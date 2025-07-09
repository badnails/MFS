const bcrypt = require('bcrypt');

async function hashPassword(password) {
  try {
    const saltRounds = 10;  // Adjust salt rounds as needed
    const salt = 'world';
    const hash = await bcrypt.hash(password + salt, 10);
    console.log('Password:', password);
    console.log('Salt:', salt);
    console.log('Hash:', hash);
  } catch (err) {
    console.error('Error hashing password:', err);
  }
}

// Replace 'your-password-here' with the password you want to hash
hashPassword('whoa');
