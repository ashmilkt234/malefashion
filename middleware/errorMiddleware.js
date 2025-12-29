// Global Express error handler
const errorHandler = (err, req, res, next) => {
  //  Log full error stack to console for debugging
  console.error("EXPRESS ERROR:", err.stack);

  // 2Send JSON response with error info
  res.status(err.statusCode || 500).json({
    success: false,           // always false on error
    message: err.message || "Server Error", // fallback message
  });
};

module.exports = errorHandler;
