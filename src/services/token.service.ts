import moment, { Moment } from "moment";
import httpStatus from "http-status";
import userService from "./user.service.js";
import ApiError from "../utils/ApiError.js";
import { Session, Token, TokenType, User } from "@prisma/client";
import prisma from "../client.js";
import logger from "../config/logger.js";
// import {
//   encodeBase32LowerCaseNoPadding,
//   encodeHexLowerCase,
// } from "@oslojs/encoding";
// import { sha256 } from "@oslojs/crypto/sha2";

/**
 * Generate session token
 * @returns {string}
 */
const generateSessionToken = async (): Promise<string> => {
  const encoding = await import("@oslojs/encoding");
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  const token = encoding.encodeBase32LowerCaseNoPadding(bytes);
  return token;
};

/**
 * Create session
 * @param {string} token
 * @param {string} userId
 * @returns {Promise<Session>}
 */
const createSession = async (
  token: string,
  userId: string,
  expiresAt?: Date
): Promise<Session> => {
  const encoding = await import("@oslojs/encoding");
  const { sha256 } = await import("@oslojs/crypto/sha2");

  const sessionId = encoding.encodeHexLowerCase(
    sha256(new TextEncoder().encode(token))
  );
  const session: Session = {
    id: sessionId,
    userId,
    expiresAt: expiresAt ?? new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
  };
  await prisma.session.create({
    data: session,
  });
  return session;
};

/**
 * Validate session token
 * @param {string} token
 * @returns {Promise<SessionValidationResult>}
 */
const validateSessionToken = async (
  token: string
): Promise<SessionValidationResult> => {
  const encoding = await import("@oslojs/encoding");
  const { sha256 } = await import("@oslojs/crypto/sha2");

  const sessionId = encoding.encodeHexLowerCase(
    sha256(new TextEncoder().encode(token))
  );
  console.log("vsessionId", sessionId);
  const result = await prisma.session.findUnique({
    where: {
      id: sessionId,
    },
    include: {
      user: true,
    },
  });
  if (result === null) {
    return { session: null, user: null };
  }
  const { user, ...session } = result;
  if (Date.now() >= session.expiresAt.getTime()) {
    await prisma.session.delete({ where: { id: sessionId } });
    return { session: null, user: null };
  }
  if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
    session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    await prisma.session.update({
      where: {
        id: session.id,
      },
      data: {
        expiresAt: session.expiresAt,
      },
    });
  }
  return { session, user };
};

/**
 * Invalidate session
 * @returns {Promise<void>}
 */
const invalidateSession = async (token: string): Promise<void> => {
  const encoding = await import("@oslojs/encoding");
  const { sha256 } = await import("@oslojs/crypto/sha2");

  const sessionId = encoding.encodeHexLowerCase(
    sha256(new TextEncoder().encode(token))
  );
  await prisma.session.delete({ where: { id: sessionId } });
};

/**
 * Save a token
 * @param {string} token
 * @param {number} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {boolean} [blacklisted]
 * @returns {Promise<Token>}
 */
const saveToken = async (
  token: string,
  userId: string,
  expires: Moment,
  type: TokenType,
  blacklisted = false
): Promise<Token> => {
  const encoding = await import("@oslojs/encoding");
  const { sha256 } = await import("@oslojs/crypto/sha2");

  const hashedToken = encoding.encodeHexLowerCase(
    sha256(new TextEncoder().encode(token))
  );
  const createdToken = await prisma.token.create({
    data: {
      token: hashedToken,
      userId: userId,
      expires: expires.toDate(),
      type,
      blacklisted,
    },
  });
  return createdToken;
};

/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<Token>}
 */
const verifyToken = async (
  token: string,
  type: TokenType,
  blacklisted = false
): Promise<Token> => {
  const encoding = await import("@oslojs/encoding");
  const { sha256 } = await import("@oslojs/crypto/sha2");
  console.log(`Verify token: ${token}`);
  const hashedToken = encoding.encodeHexLowerCase(
    sha256(new TextEncoder().encode(token))
  );
  console.log(`Verify hashedToken: ${hashedToken}`);
  const tokenData = await prisma.token.findFirst({
    where: { token: hashedToken, type, blacklisted },
  });
  console.log(
    `Verify tokenData: ${tokenData ? JSON.stringify(tokenData) : "null"}`
  );
  if (!tokenData) {
    throw new Error("Token not found");
  }
  return tokenData;
};

/**
 * Generate reset password token
 * @param {string} email
 * @returns {Promise<string>}
 */
const generateResetPasswordToken = async (
  email: string,
  expires = moment().add(10, "minutes"),
  blacklisted = false
): Promise<string> => {
  const user = await userService.getUserByEmail(email);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "No users found with this email");
  }
  const resetPasswordToken = await generateSessionToken();

  await saveToken(
    resetPasswordToken,
    user.id,
    expires,
    TokenType.RESET_PASSWORD,
    blacklisted
  );
  return resetPasswordToken;
};

/**
 * Generate verify email token
 * @param {User} user
 * @returns {Promise<string>}
 */
const generateVerifyEmailToken = async (user: {
  id: string;
}): Promise<string> => {
  const expires = moment().add(10, "minutes");
  const verifyEmailToken = await generateSessionToken();
  await saveToken(verifyEmailToken, user.id, expires, TokenType.VERIFY_EMAIL);
  return verifyEmailToken;
};

export type SessionValidationResult =
  | { session: Session; user: User }
  | { session: null; user: null };

export default {
  generateSessionToken,
  saveToken,
  verifyToken,
  generateResetPasswordToken,
  generateVerifyEmailToken,
  createSession,
  validateSessionToken,
  invalidateSession,
};
