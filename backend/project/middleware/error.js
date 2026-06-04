export function errorHandler(err, req, res, next) {
    const status = err.status || 500;
    const code = err.code || "INTERNAL_SERVER_ERROR";
    res.status(status).json({ error: code, message: err.message });
}