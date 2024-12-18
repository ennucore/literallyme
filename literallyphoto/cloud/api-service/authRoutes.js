const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const router = express.Router();
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const JWT_SECRET = process.env.JWT_SECRET || '';

router.post('/authenticate', async (req, res) => {
  const authData = req.query; // Telegram sends data as query parameters

  try {
    const dataCheckString = Object.keys(authData)
      .filter((key) => key !== 'hash')
      .sort()
      .map((key) => `${key}=${decodeURIComponent(authData[key])}`)
      .join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(BOT_TOKEN)
      .digest();

    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (
      !crypto.timingSafeEqual(
        Buffer.from(calculatedHash, 'hex'),
        Buffer.from(authData.hash, 'hex'),
      )
    ) {
      return res.status(401).send('Unauthorized');
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (currentTimestamp - parseInt(authData.auth_date, 10) > 86400) {
      return res.status(401).send('Unauthorized (stale data)');
    }

    const user = JSON.parse(authData.user);

    const token = jwt.sign({ uid: user.id }, JWT_SECRET, { expiresIn: '24h' });
    res.status(200).json({ token: token });
  } catch (error) {
    console.error('Error during authentication:', error);
    res.status(400).send('Bad Request');
  }
});

module.exports = router;
