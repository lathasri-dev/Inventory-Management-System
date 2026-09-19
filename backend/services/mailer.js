const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const checkSmtpConfig = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const missingVars = [];
  if (!host) missingVars.push('SMTP_HOST');
  if (!user) missingVars.push('SMTP_USER');
  if (!pass) missingVars.push('SMTP_PASS');

  return missingVars;
};

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

const sendMail = async ({ to, subject, html, text }) => {
  const missingVars = checkSmtpConfig();
  
  if (missingVars.length > 0) {
    logger.info('SMTP configured: false');
    throw new Error(`SMTP configuration is missing: ${missingVars.join(', ')}`);
  }

  logger.info('SMTP configured: true');
  const transporter = createTransporter();

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  try {
    logger.info('SMTP connection: attempting...');
    const info = await transporter.sendMail({ from, to, subject, html, text });
    logger.info('SMTP connection: successful');
    logger.info('Reset email send: successful');
    return info;
  } catch (err) {
    logger.info('SMTP connection: failed');
    logger.info('Reset email send: failed');
    logger.error(`Email send error: ${err.message}`);
    throw new Error('Failed to send email. Nodemailer encountered an error.');
  }
};

module.exports = {
  sendMail,
  checkSmtpConfig,
};