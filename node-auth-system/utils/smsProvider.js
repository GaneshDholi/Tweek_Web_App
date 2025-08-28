const twilio = require('twilio');

const useTwilio = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM);

let twClient = null;
if (useTwilio) {
  twClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

async function sendSms({ to, body }) {
  if (useTwilio) {
    return twClient.messages.create({ to, from: process.env.TWILIO_FROM, body });
  } else {
    // Mock mode (DEV)
    console.log(`[MOCK SMS] to=${to} body=${body}`);
    return Promise.resolve({ sid: 'MOCK-SID' });
  }
}

module.exports = { sendSms, useTwilio };
