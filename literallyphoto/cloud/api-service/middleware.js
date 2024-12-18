'use strict';

const crypto = require('crypto');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

function authenticateUser(req, res, next) {
  const authData = req.query; // Telegram sends data as query parameters

  const userData = JSON.parse(authData.user);

  // Recreate the hash Telegram sends
  try {
    const dataCheckString = Object.keys(authData)
      .filter((key) => key !== 'hash') // Exclude the hash field
      .sort() // Sort keys alphabetically
      .map((key) => `${key}=${decodeURIComponent(authData[key])}`) // Decode URI components
      .join('\n'); // Join as a single string

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(BOT_TOKEN)
      .digest();

    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    console.log('calculatedHash:', calculatedHash);
    console.log('authData.hash:', authData.hash);

    // Compare the calculated hash with the one sent by Telegram
    if (!crypto.timingSafeEqual(
      Buffer.from(calculatedHash, 'hex'),
      Buffer.from(authData.hash, 'hex')
    )) {
      return res.status(401).send('Unauthorized');
    }

    // Ensure the auth_date is recent to avoid replay attacks
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (currentTimestamp - parseInt(authData.auth_date, 10) > 86400) { // Allow 24 hours
      return res.status(401).send('Unauthorized (stale data)');
    }

    // Attach user data to the request
    req.user = userData;

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Error authenticating user:', error);
    return res.status(400).send('Bad Request');
  }
}

module.exports = { authenticateUser };
