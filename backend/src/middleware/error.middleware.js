/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
  
    // Database errors
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Resource already exists',
        error: err.detail,
      });
    }
  
    if (err.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Referenced resource not found',
        error: err.detail,
      });
    }
  
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }
  
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
      });
    }
  
    // Default error
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  };
  
  /**
   * 404 handler
   */
  const notFoundHandler = (req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
    });
  };
  
  module.exports = {
    errorHandler,
    notFoundHandler,
  };