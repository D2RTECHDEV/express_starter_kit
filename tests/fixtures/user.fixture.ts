import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";
import prisma from "../../src/client.js";
import { Prisma, Role } from "@prisma/client";
import { generateUserID } from "../../src/utils/id.js";

const password = "password1";
const salt = bcrypt.genSaltSync(8);

export const userOne = {
  id: generateUserID(16),
  name: faker.name.fullName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: Role.USER,
  isEmailVerified: false,
};

export const userTwo = {
  id: generateUserID(16),
  name: faker.name.fullName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: Role.USER,
  isEmailVerified: false,
};

export const admin = {
  id: generateUserID(16),
  name: faker.name.fullName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: Role.ADMIN,
  isEmailVerified: false,
};

export const insertUsers = async (users: Prisma.UserCreateManyInput[]) => {
  await prisma.user.createMany({
    data: users.map((user) => ({
      ...user,
      password: bcrypt.hashSync(user.password),
    })),
  });
};
