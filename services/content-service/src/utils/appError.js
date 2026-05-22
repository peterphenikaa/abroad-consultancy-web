function createError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
}

function sendError(res, error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ error: error.message });
}

module.exports = { createError, sendError };