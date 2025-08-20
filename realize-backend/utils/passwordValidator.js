/**
 * Password validation utility
 * Validates password complexity requirements
 */

const passwordValidator = {
  /**
   * Validates password meets complexity requirements
   * @param {string} password - Password to validate
   * @returns {Object} - { isValid: boolean, errors: string[] }
   */
  validatePassword: (password) => {
    const errors = [];
    
    if (!password || password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>/?)');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },
  
  /**
   * Generates a password that meets complexity requirements
   * @returns {string} - Generated password
   */
  generateValidPassword: () => {
    const upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowerCase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{};\':"|,.<>/?';
    
    let password = '';
    
    // Ensure at least one of each required character type
    password += upperCase[Math.floor(Math.random() * upperCase.length)];
    password += lowerCase[Math.floor(Math.random() * lowerCase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];
    
    // Fill remaining length with random characters
    const allChars = upperCase + lowerCase + numbers + specialChars;
    for (let i = 4; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
};

module.exports = passwordValidator;
