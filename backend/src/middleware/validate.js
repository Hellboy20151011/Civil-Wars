'use strict';

/**
 * Returns an Express middleware that validates req.body against a Zod schema.
 * On success, req.body is replaced with the parsed (coerced) data.
 * On failure, responds with 400 and the first validation error message.
 */
function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => e.message);
      return res.status(400).json({ message: errors[0], errors });
    }
    req.body = result.data;
    next();
  };
}

module.exports = { validateBody };
