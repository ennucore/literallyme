'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || '';

async function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.sendStatus(401);
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.uid = decoded.uid;
    next();
  } else {
    return res.sendStatus(401);
  }
}

module.exports = { authenticateUser };
