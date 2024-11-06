import httpStatus from "http-status";
import tokenService from "./token.service.js";
import userService from "./user.service.js";
import ApiError from "../utils/ApiError.js";
import { TokenType, User } from "@prisma/client";
import prisma from "../client.js";
import { encryptPassword, isPasswordMatch } from "../utils/encryption.js";
import exclude from "../utils/exclude.js";
import logger from "../config/logger.js";

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Omit<User, 'password'>>}
 */
const loginUserWithEmailAndPassword = async (
  email: string,
  password: string
): Promise<Omit<User, "password">> => {
  const user = await userService.getUserByEmail(email, [
    "id",
    "email",
    "name",
    "password",
    "role",
    "isEmailVerified",
    "createdAt",
    "updatedAt",
  ]);
  if (!user || !(await isPasswordMatch(password, user.password as string))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect email or password");
  }
  return exclude(user, ["password"]);
};

/**
 * Logout
 * @param {string} sessionToken
 * @returns {Promise<void>}
 */
const logout = async (sessionToken: string): Promise<void> => {
  await tokenService.invalidateSession(sessionToken);
};

/**
 * Reset password
 * @param {string} resetPasswordToken
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
const resetPassword = async (
  resetPasswordToken: string,
  newPassword: string
): Promise<void> => {
  try {
    const resetPasswordTokenData = await tokenService.verifyToken(
      resetPasswordToken,
      TokenType.RESET_PASSWORD
    );
    const user = await userService.getUserById(resetPasswordTokenData.userId);
    if (!user) {
      throw new Error();
    }
    await userService.updateUserById(user.id, { password: newPassword });
    await prisma.token.deleteMany({
      where: { userId: user.id, type: TokenType.RESET_PASSWORD },
    });
  } catch (error) {
    logger.error(error);
    throw new ApiError(httpStatus.UNAUTHORIZED, "Password reset failed");
  }
};

/**
 * Verify email
 * @param {string} verifyEmailToken
 * @returns {Promise<void>}
 */
const verifyEmail = async (verifyEmailToken: string): Promise<void> => {
  try {
    const verifyEmailTokenData = await tokenService.verifyToken(
      verifyEmailToken,
      TokenType.VERIFY_EMAIL
    );
    await prisma.token.deleteMany({
      where: {
        userId: verifyEmailTokenData.userId,
        type: TokenType.VERIFY_EMAIL,
      },
    });
    await userService.updateUserById(verifyEmailTokenData.userId, {
      isEmailVerified: true,
    });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Email verification failed");
  }
};

export default {
  loginUserWithEmailAndPassword,
  isPasswordMatch,
  encryptPassword,
  logout,
  resetPassword,
  verifyEmail,
};
