import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync.js";
import {
  authService,
  userService,
  tokenService,
  emailService,
} from "../services";
import exclude from "../utils/exclude.js";
import { User } from "@prisma/client";
import { Request, Response } from "express";

const register = catchAsync(async (req, res) => {
  const { name, email, password, role } = req.body;
  const user = await userService.createUser(name, email, password, role);
  const userWithoutPassword = exclude(user, [
    "password",
    "createdAt",
    "updatedAt",
  ]);
  const token = await tokenService.generateSessionToken();
  await tokenService.createSession(token, user.id);
  res.status(httpStatus.CREATED).send({ user: userWithoutPassword, token });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const token = await tokenService.generateSessionToken();
  await tokenService.createSession(token, user.id);
  res.send({ user, token });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.sessionToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(
    req.body.email
  );
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req, res) => {
  console.log(req.query.token, req.body.password);

  await authService.resetPassword(req.query.token as string, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as User;
    const verifyEmailToken = await tokenService.generateVerifyEmailToken(user);
    await emailService.sendVerificationEmail(user.email, verifyEmailToken);
    res.status(httpStatus.NO_CONTENT).send();
  }
);

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token as string);
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
};
