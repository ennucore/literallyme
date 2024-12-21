'use strict';
const jwt = require('jsonwebtoken');
const allowedOrigins = require('./allowedOrigins');

const JWT_SECRET = process.env.JWT_SECRET || '';

async function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.sendStatus(401);
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.uid = decoded.uid;
      next();
    } catch (error) {
      return res.sendStatus(403); // Forbidden
    }
  } else {
    return res.sendStatus(401);
  }
}

const credentials = (req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  next();
};

module.exports = { authenticateJWT, credentials };
