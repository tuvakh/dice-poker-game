// I create a central error handling middleware, so that all errors are handled in one place
// instead of writing error responses in every single route
// Express requires 4 parameters (err, req, res, next) to recognise this as an error handler, instead of a regular middleware.
// I have created a separate CustomError file in utils/ that provides a specific status and code
// Otherwise, this defaults to 500 INTERNAL_SERVER_ERROR.

export function errorHandler(err, req, res, next) {
    const status = err.status || 500;
    const code = err.code || "INTERNAL_SERVER_ERROR";
    res.status(status).json({ error: code, message: err.message });
}