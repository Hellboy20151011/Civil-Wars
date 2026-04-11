'use strict';

/**
 * Wraps an async route handler so that rejected promises are forwarded
 * to Express's next(err) error handler instead of causing unhandled rejections.
 */
function asyncWrapper(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncWrapper };
