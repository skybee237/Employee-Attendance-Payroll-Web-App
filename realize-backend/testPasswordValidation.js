// Simple test script to verify password validation
const passwordValidator = require('./utils/passwordValidator');

console.log('Testing Password Validation Utility\n');

// Test cases
const testCases = [
  { password: 'weak', description: 'Too short' },
  { password: 'password', description: 'No numbers, uppercase, or special chars' },
  { password: 'Password', description: 'No numbers or special chars' },
  { password: 'password123', description: 'No uppercase or special chars' },
  { password: 'PASSWORD123', description: 'No lowercase or special chars' },
  { password: 'Password123', description: 'No special chars' },
  { password: 'Pass123!', description: 'Valid password' },
  { password: 'MyP@ssw0rd123', description: 'Valid complex password' }
];

testCases.forEach(({ password, description }) => {
  const result = passwordValidator.validatePassword(password);
  console.log(`Test: ${description}`);
  console.log(`Password: "${password}"`);
  console.log(`Valid: ${result.isValid}`);
  if (!result.isValid) {
    console.log('Issues:', result.errors);
  }
  console.log('---');
});

// Test password generation
console.log('\nTesting Password Generation:');
const generated = passwordValidator.generateValidPassword();
console.log('Generated password:', generated);
console.log('Validation result:', passwordValidator.validatePassword(generated));
