import request from "supertest";
import { faker } from "@faker-js/faker";
import httpStatus from "http-status";
import httpMocks from "node-mocks-http";
import moment from "moment";
import bcrypt from "bcryptjs";
import app from "../../src/app.js";
import auth from "../../src/middlewares/auth.js";
import { emailService, tokenService } from "../../src/services";
import ApiError from "../../src/utils/ApiError.js";
import setupTestDB from "../utils/setupTestDb.js";
import { describe, beforeEach, test, expect, vi } from "vitest";
import { userOne, admin, insertUsers } from "../fixtures/user.fixture.js";
import { Role, TokenType, User } from "@prisma/client";
import prisma from "../../src/client.js";
import { roleRights } from "../../src/config/roles.js";
import logger from "src/config/logger.js";

setupTestDB();

describe("Auth routes", () => {
  describe("POST /v1/auth/register", () => {
    let newUser: { name: string; email: string; password: string };
    beforeEach(() => {
      newUser = {
        name: faker.name.fullName(),
        email: faker.internet.email().toLowerCase(),
        password: "Passwo1d@123",
      };
    });

    test("should return 201 and successfully register user if request data is ok", async () => {
      const res = await request(app)
        .post("/v1/auth/register")
        .send(newUser)
        .expect(httpStatus.CREATED);

      expect(res.body.user).not.toHaveProperty("password");
      expect(res.body.user).toEqual({
        id: expect.anything(),
        name: newUser.name,
        email: newUser.email,
        role: Role.USER,
        isEmailVerified: false,
      });

      const dbUser = await prisma.user.findUnique({
        where: { id: res.body.user.id },
      });
      expect(dbUser).toBeDefined();
      expect(dbUser?.password).not.toBe(newUser.password);
      expect(dbUser).toMatchObject({
        name: newUser.name,
        email: newUser.email,
        role: Role.USER,
        isEmailVerified: false,
      });

      expect(res.body.token).not.toBeNull();
    });

    test("should return 400 error if email is invalid", async () => {
      newUser.email = "invalidEmail";

      await request(app)
        .post("/v1/auth/register")
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 400 error if email is already used", async () => {
      await insertUsers([userOne]);
      newUser.email = userOne.email;

      await request(app)
        .post("/v1/auth/register")
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 400 error if password length is less than 8 characters", async () => {
      newUser.password = "passwo1";

      await request(app)
        .post("/v1/auth/register")
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 400 error if password does not contain both letters and numbers", async () => {
      newUser.password = "password";

      await request(app)
        .post("/v1/auth/register")
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);

      newUser.password = "11111111";

      await request(app)
        .post("/v1/auth/register")
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe("POST /v1/auth/login", () => {
    test("should return 200 and login user if email and password match", async () => {
      await insertUsers([userOne]);
      const loginCredentials = {
        email: userOne.email,
        password: userOne.password,
      };

      const res = await request(app)
        .post("/v1/auth/login")
        .send(loginCredentials)
        .expect(httpStatus.OK);

      expect(res.body.user).toMatchObject({
        id: expect.anything(),
        name: userOne.name,
        email: userOne.email,
        role: userOne.role,
        isEmailVerified: userOne.isEmailVerified,
      });

      expect(res.body.user).toEqual(
        expect.not.objectContaining({ password: expect.anything() })
      );

      expect(res.body.token).not.toBeNull();
    });

    test("should return 401 error if there are no users with that email", async () => {
      const loginCredentials = {
        email: userOne.email,
        password: userOne.password,
      };

      const res = await request(app)
        .post("/v1/auth/login")
        .send(loginCredentials)
        .expect(httpStatus.UNAUTHORIZED);

      expect(res.body).toEqual({
        code: httpStatus.UNAUTHORIZED,
        message: "Incorrect email or password",
      });
    });

    test("should return 401 error if password is wrong", async () => {
      await insertUsers([userOne]);
      const loginCredentials = {
        email: userOne.email,
        password: "wrongPassword1",
      };

      const res = await request(app)
        .post("/v1/auth/login")
        .send(loginCredentials)
        .expect(httpStatus.UNAUTHORIZED);

      expect(res.body).toEqual({
        code: httpStatus.UNAUTHORIZED,
        message: "Incorrect email or password",
      });
    });
  });

  // describe("POST /v1/auth/logout", () => {});

  describe("POST /v1/auth/forgot-password", () => {
    beforeEach(() => {
      vi.spyOn(emailService.transport, "sendMail").mockClear();
    });

    test("should return 204 and send reset password email to the user", async () => {
      await insertUsers([userOne]);
      const dbUserOne = (await prisma.user.findUnique({
        where: { email: userOne.email },
      })) as User;
      const sendResetPasswordEmailSpy = vi
        .spyOn(emailService, "sendResetPasswordEmail")
        .mockImplementationOnce(() => new Promise((resolve) => resolve()));

      await request(app)
        .post("/v1/auth/forgot-password")
        .send({ email: userOne.email })
        .expect(httpStatus.NO_CONTENT);

      expect(sendResetPasswordEmailSpy).toHaveBeenCalledWith(
        userOne.email,
        expect.any(String)
      );
      const resetPasswordToken = sendResetPasswordEmailSpy.mock.calls[0][1];
      const dbResetPasswordTokenData = await prisma.token.findFirst({
        where: {
          token: resetPasswordToken,
          userId: dbUserOne.id,
        },
      });
      expect(dbResetPasswordTokenData).toBeDefined();
    });

    test("should return 400 if email is missing", async () => {
      await insertUsers([userOne]);

      await request(app)
        .post("/v1/auth/forgot-password")
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 404 if email does not belong to any user", async () => {
      await request(app)
        .post("/v1/auth/forgot-password")
        .send({ email: userOne.email })
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe("POST /v1/auth/reset-password", () => {
    test("should return 204 and reset the password", async () => {
      await insertUsers([userOne]);
      const dbUserOne = (await prisma.user.findUnique({
        where: { email: userOne.email },
      })) as User;
      const expires = moment().add(10, "minutes");
      const resetPasswordToken = await tokenService.generateResetPasswordToken(
        dbUserOne.email
      );
      console.log(resetPasswordToken);
      // await tokenService.saveToken(
      //   resetPasswordToken,
      //   dbUserOne.id,
      //   expires,
      //   TokenType.RESET_PASSWORD,
      //   false
      // );

      await request(app)
        .post("/v1/auth/reset-password")
        .query({ token: resetPasswordToken })
        .send({ password: "password@123" })
        .expect(httpStatus.NO_CONTENT);

      const dbUser = (await prisma.user.findUnique({
        where: { id: dbUserOne.id },
      })) as User;
      const isPasswordMatch = await bcrypt.compare(
        "password@123",
        dbUser.password
      );
      expect(isPasswordMatch).toBe(true);

      const dbResetPasswordTokenCount = await prisma.token.count({
        where: {
          userId: dbUserOne.id,
          type: TokenType.RESET_PASSWORD,
        },
      });
      expect(dbResetPasswordTokenCount).toBe(0);
    });

    test("should return 400 if reset password token is missing", async () => {
      await insertUsers([userOne]);

      await request(app)
        .post("/v1/auth/reset-password")
        .send({ password: "password2" })
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 401 if reset password token is blacklisted", async () => {
      await insertUsers([userOne]);
      const dbUserOne = (await prisma.user.findUnique({
        where: { email: userOne.email },
      })) as User;
      const expires = moment().add(10, "minutes");
      const resetPasswordToken = await tokenService.generateResetPasswordToken(
        dbUserOne.email,
        expires,
        true
      );
      // await tokenService.saveToken(
      //   resetPasswordToken,
      //   dbUserOne.id,
      //   expires,
      //   TokenType.RESET_PASSWORD,
      //   true
      // );

      await request(app)
        .post("/v1/auth/reset-password")
        .query({ token: resetPasswordToken })
        .send({ password: "password2" })
        .expect(httpStatus.UNAUTHORIZED);
    });

    // test("should return 401 if reset password token is expired", async () => {
    //   await insertUsers([userOne]);
    //   const dbUserOne = (await prisma.user.findUnique({
    //     where: { email: userOne.email },
    //   })) as User;
    //   const expires = moment().subtract(10, "minutes");
    //   const resetPasswordToken = await tokenService.generateResetPasswordToken(
    //     dbUserOne.email,
    //     expires
    //   );

    //   await request(app)
    //     .post("/v1/auth/reset-password")
    //     .query({ token: resetPasswordToken })
    //     .send({ password: "password2" })
    //     .expect(httpStatus.UNAUTHORIZED);
    // });

    test("should return 400 if password is missing or invalid", async () => {
      await insertUsers([userOne]);
      const dbUserOne = (await prisma.user.findUnique({
        where: { email: userOne.email },
      })) as User;
      const expires = moment().add(10, "minutes");
      const resetPasswordToken = await tokenService.generateSessionToken();
      await tokenService.saveToken(
        resetPasswordToken,
        dbUserOne.id,
        expires,
        TokenType.RESET_PASSWORD
      );

      await request(app)
        .post("/v1/auth/reset-password")
        .query({ token: resetPasswordToken })
        .expect(httpStatus.BAD_REQUEST);

      await request(app)
        .post("/v1/auth/reset-password")
        .query({ token: resetPasswordToken })
        .send({ password: "short1" })
        .expect(httpStatus.BAD_REQUEST);

      await request(app)
        .post("/v1/auth/reset-password")
        .query({ token: resetPasswordToken })
        .send({ password: "password" })
        .expect(httpStatus.BAD_REQUEST);

      await request(app)
        .post("/v1/auth/reset-password")
        .query({ token: resetPasswordToken })
        .send({ password: "11111111" })
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe("POST /v1/auth/send-verification-email", () => {
    beforeEach(() => {
      vi.spyOn(emailService.transport, "sendMail").mockClear();
    });

    test("should return 204 and send verification email to the user", async () => {
      await insertUsers([userOne]);
      const dbUserOne = (await prisma.user.findUnique({
        where: { email: userOne.email },
      })) as User;
      const sendVerificationEmailSpy = vi
        .spyOn(emailService, "sendVerificationEmail")
        .mockImplementationOnce(() => new Promise((resolve) => resolve()));
      const userOneAccessToken = await tokenService.generateSessionToken();
      await tokenService.createSession(userOneAccessToken, dbUserOne.id);

      await request(app)
        .post("/v1/auth/send-verification-email")
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.NO_CONTENT);

      expect(sendVerificationEmailSpy).toHaveBeenCalledWith(
        userOne.email,
        expect.any(String)
      );
      const verifyEmailToken = sendVerificationEmailSpy.mock.calls[0][1];
      const dbVerifyEmailToken = await prisma.token.findFirst({
        where: {
          token: verifyEmailToken,
          userId: dbUserOne.id,
        },
      });

      expect(dbVerifyEmailToken).toBeDefined();
    });

    test("should return 401 error if access token is missing", async () => {
      await insertUsers([userOne]);

      await request(app)
        .post("/v1/auth/send-verification-email")
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe("POST /v1/auth/verify-email", () => {
    // test("should return 204 and verify the email", async () => {
    //   await insertUsers([userOne]);
    //   const dbUserOne = (await prisma.user.findUnique({
    //     where: { email: userOne.email },
    //   })) as User;
    //   const expires = moment().add(10, "minutes");
    //   const verifyEmailToken = await tokenService.generateVerifyEmailToken({
    //     id: dbUserOne.id,
    //   });
    //   // await tokenService.saveToken(
    //   //   verifyEmailToken,
    //   //   dbUserOne.id,
    //   //   expires,
    //   //   TokenType.VERIFY_EMAIL
    //   // );

    //   await request(app)
    //     .post("/v1/auth/verify-email")
    //     .query({ token: verifyEmailToken })
    //     .send()
    //     .expect(httpStatus.NO_CONTENT);

    //   const dbUser = (await prisma.user.findUnique({
    //     where: { id: dbUserOne.id },
    //   })) as User;

    //   expect(dbUser.isEmailVerified).toBe(true);

    //   const dbVerifyEmailToken = await prisma.token.count({
    //     where: {
    //       userId: dbUserOne.id,
    //       type: TokenType.VERIFY_EMAIL,
    //     },
    //   });
    //   expect(dbVerifyEmailToken).toBe(0);
    // });

    test("should return 400 if verify email token is missing", async () => {
      await insertUsers([userOne]);

      await request(app)
        .post("/v1/auth/verify-email")
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 401 if verify email token is blacklisted", async () => {
      await insertUsers([userOne]);
      const dbUserOne = (await prisma.user.findUnique({
        where: { email: userOne.email },
      })) as User;
      const expires = moment().add(10, "minutes");
      const verifyEmailToken = await await tokenService.generateSessionToken();
      await tokenService.saveToken(
        verifyEmailToken,
        dbUserOne.id,
        expires,
        TokenType.VERIFY_EMAIL,
        true
      );

      await request(app)
        .post("/v1/auth/verify-email")
        .query({ token: verifyEmailToken })
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 401 if verify email token is expired", async () => {
      await insertUsers([userOne]);
      const dbUserOne = (await prisma.user.findUnique({
        where: { email: userOne.email },
      })) as User;
      const expires = moment().subtract(1, "minutes");
      const verifyEmailToken = await await tokenService.generateSessionToken();
      await tokenService.saveToken(
        verifyEmailToken,
        dbUserOne.id,
        expires,
        TokenType.VERIFY_EMAIL
      );

      await request(app)
        .post("/v1/auth/verify-email")
        .query({ token: verifyEmailToken })
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });

    // test('should return 401 if user is not found', async () => {
    //   const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
    //   const verifyEmailToken = tokenService.generateSessionToken(
    //     _EMAIL
    //   );
    //   await tokenService.saveToken(verifyEmailToken, dbUserOne.id, expires, TokenType.VERIFY_EMAIL);

    //   await request(app)
    //     .post('/v1/auth/verify-email')
    //     .query({ token: verifyEmailToken })
    //     .send()
    //     .expect(httpStatus.UNAUTHORIZED);
    // });
  });
});

describe("Auth middleware", () => {
  test("should call next with no errors if access token is valid", async () => {
    await insertUsers([userOne]);
    const dbUserOne = (await prisma.user.findUnique({
      where: { email: userOne.email },
    })) as User;
    const userOneAccessToken = await tokenService.generateSessionToken();
    await tokenService.createSession(userOneAccessToken, dbUserOne.id);
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${userOneAccessToken}` },
    });
    const next = vi.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith();
    expect((req.user as User).id).toEqual(dbUserOne.id);
  });

  test("should call next with unauthorized error if access token is not found in header", async () => {
    await insertUsers([userOne]);
    const req = httpMocks.createRequest();
    const next = vi.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "Please authenticate",
      })
    );
  });

  test("should call next with unauthorized error if access token is not a valid session token", async () => {
    await insertUsers([userOne]);
    const req = httpMocks.createRequest({
      headers: { Authorization: "Bearer randomToken" },
    });
    const next = vi.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "Please authenticate",
      })
    );
  });

  test("should call next with unauthorized error if the token is not an access token", async () => {
    await insertUsers([userOne]);
    const dbUserOne = (await prisma.user.findUnique({
      where: { email: userOne.email },
    })) as User;
    const expires = moment().add(10, "minutes");
    const refreshToken = await tokenService.generateSessionToken();
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${refreshToken}` },
    });
    const next = vi.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "Please authenticate",
      })
    );
  });

  test("should call next with unauthorized error if access token is generated with an invalid secret", async () => {
    await insertUsers([userOne]);
    const dbUserOne = (await prisma.user.findUnique({
      where: { email: userOne.email },
    })) as User;
    const expires = moment().add(10, "minutes");
    const accessToken = await tokenService.generateSessionToken();
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const next = vi.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "Please authenticate",
      })
    );
  });

  test("should call next with unauthorized error if access token is expired", async () => {
    await insertUsers([userOne]);
    const dbUserOne = (await prisma.user.findUnique({
      where: { email: userOne.email },
    })) as User;
    const expires = moment().subtract(1, "minutes");
    const accessToken = await tokenService.generateSessionToken();
    await tokenService.createSession(
      accessToken,
      dbUserOne.id,
      expires.toDate()
    );
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log(req.body);
    const next = vi.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "Please authenticate",
      })
    );
  });

  test("should call next with unauthorized error if user is not found", async () => {
    const userOneAccessToken = await tokenService.generateSessionToken();
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${userOneAccessToken}` },
    });
    const next = vi.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "Please authenticate",
      })
    );
  });

  test("should call next with forbidden error if user does not have required rights and userId is not in params", async () => {
    await insertUsers([userOne]);
    const dbUserOne = (await prisma.user.findUnique({
      where: { email: userOne.email },
    })) as User;
    const userOneAccessToken = await tokenService.generateSessionToken();
    await tokenService.createSession(userOneAccessToken, dbUserOne.id);
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${userOneAccessToken}` },
    });
    const next = vi.fn();

    await auth("anyRight")(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: httpStatus.FORBIDDEN,
        message: "Forbidden",
      })
    );
  });

  // test("should call next with no errors if user does not have required rights but userId is in params", async () => {
  //   await insertUsers([userOne]);
  //   const dbUserOne = (await prisma.user.findUnique({
  //     where: { email: userOne.email },
  //   })) as User;
  //   const userOneAccessToken = await tokenService.generateSessionToken();
  //   const req = httpMocks.createRequest({
  //     headers: { Authorization: `Bearer ${userOneAccessToken}` },
  //     params: { userId: dbUserOne.id },
  //   });
  //   const next = vi.fn();

  //   await auth("anyRight")(req, httpMocks.createResponse(), next);

  //   expect(next).toHaveBeenCalledWith();
  // });

  test("should call next with no errors if user has required rights", async () => {
    await insertUsers([admin]);
    const dbAdmin = (await prisma.user.findUnique({
      where: { email: admin.email },
    })) as User;
    const adminAccessToken = await await tokenService.generateSessionToken();
    await tokenService.createSession(adminAccessToken, dbAdmin.id);
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${adminAccessToken}` },
      params: { userId: dbAdmin.id },
    });
    const next = vi.fn();

    await auth(...(roleRights.get(Role.ADMIN) as string[]))(
      req,
      httpMocks.createResponse(),
      next
    );

    expect(next).toHaveBeenCalledWith();
  });
});
