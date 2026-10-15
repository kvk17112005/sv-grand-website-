import { badRequest } from "../lib/errors.js";

function validationMessage(error) {
  return error.issues?.[0]?.message || "Invalid request.";
}

export function validateBody(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return next(badRequest(validationMessage(parsed.error)));
    req.body = parsed.data;
    return next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) return next(badRequest(validationMessage(parsed.error)));
    req.validatedQuery = parsed.data;
    return next();
  };
}

export function validateParams(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.params);
    if (!parsed.success) return next(badRequest(validationMessage(parsed.error)));
    req.validatedParams = parsed.data;
    return next();
  };
}
