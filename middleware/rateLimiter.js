const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { msg: 'Too many requests from this IP, please try again later.' }
});

const writeLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 5,
  message: { msg: 'You are sending requests too quickly. Slow down.' }
});

module.exports = {
  authLimiter,
  writeLimiter
};
