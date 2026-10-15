export class ApiError extends Error {
  constructor(message, status = 500, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (message, details) => new ApiError(message, 400, details);
export const unauthorized = (message = "Please sign in to continue.") => new ApiError(message, 401);
export const forbidden = (message = "You do not have permission to do that.") => new ApiError(message, 403);
export const notFound = (message = "Not found.") => new ApiError(message, 404);
export const conflict = (message) => new ApiError(message, 409);
