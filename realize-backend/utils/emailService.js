const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Function to send employee credentials email
const sendEmployeeCredentials = async (email, password) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your Employee Account Credentials',
    html: `
      <h2>Welcome to the Employee Attendance & Payroll System</h2>
      <p>Your account has been created successfully.</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Password:</strong> ${password}</p>
      <p>Please log in and change your password immediately for security reasons.</p>
      <p>If you have any questions, contact your administrator.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Credentials email sent to ${email}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Function to send suspension notification email
const sendSuspensionNotification = async (email, reason) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Account Suspension Notification',
    html: `
      <h2>Account Suspension Notice</h2>
      <p>Your employee account has been suspended.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>If you believe this is an error or have questions, please contact your administrator.</p>
      <p>You will not be able to access the system until your account is reinstated.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Suspension notification email sent to ${email}`);
  } catch (error) {
    console.error('Error sending suspension notification email:', error);
    throw error;
  }
};

module.exports = {
  sendEmployeeCredentials,
  sendSuspensionNotification
};
