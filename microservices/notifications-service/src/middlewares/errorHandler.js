import AppError from "../errors/AppError.js";

const errorHandler = (error, req, res, next) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.message,
    });
  }

  return res.status(error.statusCode).json({
    error: error.message,
  });
};

export default errorHandler;
