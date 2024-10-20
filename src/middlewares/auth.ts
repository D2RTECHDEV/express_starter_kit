import httpStatus from "http-status";
import ApiError from "../utils/ApiError.js";
import { roleRights } from "../config/roles.js";
import { NextFunction, Request, Response } from "express";
import { tokenService } from "../services";

const auth =
  (...requiredRights: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    return new Promise(async (resolve, reject) => {
      const sessionId = req.headers.authorization?.split(" ")[1] as string;
      const { session, user } = await tokenService.validateSessionToken(
        sessionId
      );

      if (!session) {
        return reject(
          new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate")
        );
      }

      req.user = user;
      if (requiredRights.length) {
        const userRights = roleRights.get(user.role) ?? [];
        const hasRequiredRights = requiredRights.every((requiredRight) =>
          userRights.includes(requiredRight)
        );
        if (!hasRequiredRights && req.params.userId !== user.id) {
          return reject(new ApiError(httpStatus.FORBIDDEN, "Forbidden"));
        }
      }
      resolve(res);
    })
      .then(() => next())
      .catch((err) => next(err));
  };

export default auth;
