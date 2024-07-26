import { Request, Response, NextFunction } from "express";

export const errorCatcher = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log(err, "Error.......................");
  let message = err?.message || "Internal Server Error";
  const errorCode = err?.statusCode || 500;

  res?.status(errorCode).json({
    success: false,
    message,
  });
};
