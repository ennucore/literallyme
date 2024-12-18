'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || '';

async function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization;
  console.log('authHeader:', authHeader);
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    console.log('token:', token);
    if (!token) {
      return res.sendStatus(401);
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('decoded:', decoded);
    req.uid = decoded.uid;
    console.log('req.uid:', req.uid);
    next();
  } else {
    return res.sendStatus(401);
  }
}

module.exports = { authenticateUser };
