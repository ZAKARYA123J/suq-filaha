import { Request, Response, NextFunction } from 'express';
import { config } from 'dotenv';
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  if (error.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      error: 'Database error',
      message: error.message,
    });
  }

  return res.status(500).json({
    error: 'Internal server error',
    message: config.name === 'development' ? error.message : 'Something went wrong',
  });
};