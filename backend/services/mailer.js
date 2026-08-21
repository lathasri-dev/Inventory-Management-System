const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

const sendMail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();

  if (!transporter) {
    logger.warn('SMTP is not configured. Skipping email send.', { to, subject });
    return { skipped: true };
  }

  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  return transporter.sendMail({ from, to, subject, html, text });
};

module.exports = {
  sendMail,
};