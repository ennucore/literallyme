'use strict';

const { crypto } = require('./crypto');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

function validateTelegramAuth(req, res, next) {
  try {
    const authData = req.query; // Extract data sent from the frontend

    if (!authData || !authData.hash) {
      return res.status(400).send("Missing authentication data or hash");
    }

    const { hash, ...authFields } = authData;

    // Step 1: Create a sorted string from the fields (excluding 'hash')
    const sortedKeys = Object.keys(authFields).sort();
    const checkString = sortedKeys.map((key) => `${key}=${authFields[key]}`).join("\n");

    // Step 2: Generate the secret key based on your bot token
    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(BOT_TOKEN)
      .digest(); // Secret key derived from bot token

    // Step 3: Generate the HMAC-SHA256 hash of the check string
    const computedHash = crypto
      .createHmac("sha256", secretKey)
      .update(checkString)
      .digest("hex");

    // Step 4: Validate the computed hash against the provided hash
    if (computedHash !== hash) {
      return res.status(403).send("Invalid hash. Authentication failed");
    }

    // Step 5: Validate the `auth_date` to ensure it's recent (e.g., within 1 day)
    const authDate = parseInt(authFields.auth_date, 10);
    if (Date.now() / 1000 - authDate > 86400) { // 86400 seconds = 1 day
      return res.status(403).send("Authentication expired");
    }

    // Attach validated user data to the request object
    req.user = authFields;

    // Call the next middleware/route handler
    next();
  } catch (error) {
    console.error("Error during Telegram authentication:", error);
    return res.status(500).send("Server error during authentication");
  }
}

module.exports = { validateTelegramAuth };
