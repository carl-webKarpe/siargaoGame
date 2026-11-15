import { HttpError } from '../utils/http.js';

/** Validate req.body against a zod schema, replacing it with the parsed value. */
export const validateBody = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return next(new HttpError(400, details[0]?.message || 'Invalid request', details));
  }
  req.body = result.data;
  next();
};
