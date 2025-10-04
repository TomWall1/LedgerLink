// Error handling middleware for Express
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    status: statusCode,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export default errorHandler;
