// This file extends the built-in Error class to add an HTTP status code and a machine-readable error code.
// It allows the central error handler in middleware/error.js to return consistent error responses.

export class CustomError extends Error {
    constructor(message, status, code) {
        // This calls the parent Error constructor to set the error message
        super(message);
        // status is the HTTP status code (e.g. 404, 400, 403)
        this.status = status;
        // code is a machine-readable string (e.g. "NOT_FOUND") returned in the JSON response
        this.code = code;
    }
}
