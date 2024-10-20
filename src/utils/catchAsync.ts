import { RequestHandler } from "express";
import { Request, Response, NextFunction } from "express";

export interface CustomParamsDictionary {
  [key: string]: any;
}

const catchAsync =
  (
    fn: RequestHandler<
      CustomParamsDictionary,
      any,
      any,
      qs.ParsedQs,
      Record<string, any>
    >
  ) =>
  (
    req: Request<CustomParamsDictionary, any, any, any, Record<string, any>>,
    res: Response,
    next: NextFunction
  ) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };

export default catchAsync;
