# ExpressJS Boilerplate

A boilerplate/starter project for quickly building RESTful APIs using [Node.js](https://nodejs.org), [TypeScript](https://www.typescriptlang.org), [Express](https://expressjs.com), and [Prisma](https://www.prisma.io).

This project is an adaptation of the project [RESTful API Node Server Boilerplate](https://github.com/hagopj13/node-express-boilerplate) using a [MySQL](https://mysql.com) database with [Prisma](https://www.prisma.io) ORM. Many of the files are just an adaptation to [TypeScript](https://www.typescriptlang.org) from the files of the previously mentioned project.

## Quick Start

#### Prerequisites

- **Node.js**: Ensure you have Node.js installed (version 18.x or above is recommended). You can download it from [Node.js Official Website](https://nodejs.org/).
- **MySQL**: Install MySQL (version 5.7 or above). You’ll need this for database operations. Follow [MySQL Installation Guide](https://dev.mysql.com/doc/refman/5.7/en/installing.html) for setup instructions.
- **Docker**: Required for running the test database in a containerized environment. [Install Docker](https://docs.docker.com/get-docker/) if it’s not already installed.
- **pnpm**: Install `pnpm` (version 6.x or above) for efficient package management. You can install it globally via:
   ```bash
   npm install -g pnpm
   ```



Clone the repo:

```bash
git clone https://github.com/D2RTECHDEV/express_starter_kit.git
cd express_starter_kit
npx rimraf ./.git
```

Initialise git repo

```bash
git init
```

Install the dependencies:

```bash
pnpm install
```

Set the environment variables:

```bash
cp .env.example .env

# open .env and modify the environment variables (if needed)
```

## Table of Contents

- [ExpressJS Boilerplate](#expressjs-boilerplate)
  - [Quick Start](#quick-start)
      - [Prerequisites](#prerequisites)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Project Structure](#project-structure)
  - [Environment Variables](#environment-variables)
  - [Commands](#commands)
  - [API Documentation](#api-documentation)
    - [API Endpoints](#api-endpoints)
  - [Error Handling](#error-handling)
  - [Validation](#validation)
  - [Authentication](#authentication)
  - [Authorization](#authorization)
  - [Logging](#logging)
  - [Linting](#linting)
  - [Testing](#testing)
      - [1. Setting Up the Test Environment](#1-setting-up-the-test-environment)
      - [2. Organizing Test Files](#2-organizing-test-files)
      - [3. Writing Test Cases in TypeScript](#3-writing-test-cases-in-typescript)
      - [4. Mocking Dependencies](#4-mocking-dependencies)
      - [5. Running Tests](#5-running-tests)
      - [6. Writing Descriptive Tests](#6-writing-descriptive-tests)
      - [7. Stopping the Test Database](#7-stopping-the-test-database)
  - [Add New Functionality](#add-new-functionality)
      - [1. Define the Route and Controller](#1-define-the-route-and-controller)
      - [2. Create the Controller](#2-create-the-controller)
      - [3. Add Business Logic in the Service Layer](#3-add-business-logic-in-the-service-layer)
      - [4. Define Validation Schemas](#4-define-validation-schemas)
      - [5. Update Swagger Documentation](#5-update-swagger-documentation)
      - [6. Test the New Route](#6-test-the-new-route)

## Features

- **SQL database**: [MySQL](https://www.mysql.com) object data modeling using [Prisma](https://www.prisma.io) ORM
- **Authentication and authorization**: session based authentication mechanism 
- **Validation**: request data validation using [Joi](https://joi.dev)
- **Logging**: using [winston](https://github.com/winstonjs/winston) and [morgan](https://github.com/expressjs/morgan)
- **Testing**: unit and integration tests using [Vitest](https://vitest.dev)
- **Error handling**: centralized error handling mechanism
- **API documentation**: with [swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc) and [swagger-ui-express](https://github.com/scottie1984/swagger-ui-express)
- **Process management**: advanced production process management using [PM2](https://pm2.keymetrics.io)
- **Dependency management**: with [pnpm](https://pnpm.io)
- **Environment variables**: using [dotenv](https://github.com/motdotla/dotenv) and [cross-env](https://github.com/kentcdodds/cross-env#readme)
- **Security**: set security HTTP headers using [helmet](https://helmetjs.github.io)
- **Santizing**: sanitize request data against xss and query injection
- **CORS**: Cross-Origin Resource-Sharing enabled using [cors](https://github.com/expressjs/cors)
- **Compression**: gzip compression with [compression](https://github.com/expressjs/compression)
- **Test**: Superfast unit testing with [vitest](https://vitest.dev)
- **Code coverage**: Code coverage with [vitest](https://vitest.dev)
- **Git hooks**: with [Husky](https://github.com/typicode/husky) and [lint-staged](https://github.com/okonet/lint-staged)
- **Linting**: with [Biome](https://biomejs.dev)
- **Editor config**: consistent editor configuration using [EditorConfig](https://editorconfig.org)

## Project Structure

```
src\
 |--config\         # Environment variables and configuration related things
 |--controllers\    # Route controllers (controller layer)
 |--docs\           # Swagger files
 |--middlewares\    # Custom express middlewares
 |--routes\         # Routes
 |--services\       # Business logic (service layer)
 |--utils\          # Utility classes and functions
 |--validations\    # Request data validation schemas
 |--app.js          # Express app
 |--index.js        # App entry point
```


## Environment Variables

The environment variables can be found and modified in the `.env` file. They come with these default values:

```bash
# Port number
PORT=3005

# MySQL URL
DATABASE_URL="mysql://root:root@localhost:3306/mydb?schema=public"

# SMTP configuration options for the email service
# For testing, you can use a fake SMTP service like Ethereal: https://ethereal.email/create
SMTP_HOST=email-server
SMTP_PORT=587
SMTP_USERNAME=email-server-username
SMTP_PASSWORD=email-server-password
EMAIL_FROM=support@yourapp.com
```

## Commands

Database:

```bash
# push changes to db
pnpm db:push

# start prisma studio. This will open up your browser window and you shall be able to view the DB model and data within the tables.
pnpm db:studio
```

Running locally:

```bash
pnpm dev
```

Running in production:

```bash
pnpm start
```

Linting:

```bash
# Lint
pnpm lint

# fix lint errors
pnpm lint:fix

# run formater
pnpm format

# fix format errors
pnpm format:fix
```

Test:

```bash
# Test
pnpm test

# Test with UI
pnpm test:ui
```

Code Coverage:

```bash
pnpm coverage
```

## API Documentation

To view the list of available APIs and their specifications, run the server and go to `http://localhost:3000/v1/docs` in your browser. This documentation page is automatically generated using the [swagger](https://swagger.io/) definitions written as comments in the route files.

### API Endpoints

List of available routes:

**Auth routes**:\
`POST /v1/auth/register` - register\
`POST /v1/auth/login` - login\
`POST /v1/auth/refresh-tokens` - refresh auth tokens\
`POST /v1/auth/forgot-password` - send reset password email\
`POST /v1/auth/reset-password` - reset password\
`POST /v1/auth/send-verification-email` - send verification email\
`POST /v1/auth/verify-email` - verify email

**User routes**:\
`POST /v1/users` - create a user\
`GET /v1/users` - get all users\
`GET /v1/users/:userId` - get user\
`PATCH /v1/users/:userId` - update user\
`DELETE /v1/users/:userId` - delete user

## Error Handling

The app has a centralized error handling mechanism.

Controllers should try to catch the errors and forward them to the error handling middleware (by calling `next(error)`). For convenience, you can also wrap the controller inside the catchAsync utility wrapper, which forwards the error.

```javascript
const catchAsync = require('../utils/catchAsync');

const controller = catchAsync(async (req, res) => {
  // this error will be forwarded to the error handling middleware
  throw new Error('Something wrong happened');
});
```

The error handling middleware sends an error response, which has the following format:

```json
{
  "code": 404,
  "message": "Not found"
}
```

When running in development mode, the error response also contains the error stack.

The app has a utility ApiError class to which you can attach a response code and a message, and then throw it from anywhere (catchAsync will catch it).

For example, if you are trying to get a user from the DB who is not found, and you want to send a 404 error, the code should look something like:

```javascript
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

const getUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
};
```

## Validation

Request data is validated using [Joi](https://joi.dev/). Check the [documentation](https://joi.dev/api/) for more details on how to write Joi validation schemas.

The validation schemas are defined in the `src/validations` directory and are used in the routes by providing them as parameters to the `validate` middleware.

```javascript
const express = require('express');
const validate = require('../../middlewares/validate');
const userValidation = require('../../validations/user.validation');
const userController = require('../../controllers/user.controller');

const router = express.Router();

router.post('/users', validate(userValidation.createUser), userController.createUser);
```

## Authentication

To require authentication for certain routes, you can use the `auth` middleware.

```javascript
const express = require('express');
const auth = require('../../middlewares/auth');
const userController = require('../../controllers/user.controller');

const router = express.Router();

router.post('/users', auth(), userController.createUser);
```

These routes require a valid session token in the Authorization request header using the Bearer schema. If the request does not contain a valid session token, an Unauthorized (401) error is thrown.

**Generating Session Tokens**:

An session token can be generated by making a successful call to the register (`POST /v1/auth/register`) or login (`POST /v1/auth/login`) endpoints.

An session token is valid for 30 days and automatically refreshed every 15 days.

## Authorization

The `auth` middleware can also be used to require certain rights/permissions to access a route.

```javascript
const express = require('express');
const auth = require('../../middlewares/auth');
const userController = require('../../controllers/user.controller');

const router = express.Router();

router.post('/users', auth('manageUsers'), userController.createUser);
```

In the example above, an authenticated user can access this route only if that user has the `manageUsers` permission.

The permissions are role-based. You can view the permissions/rights of each role in the `src/config/roles.js` file.

If the user making the request does not have the required permissions to access this route, a Forbidden (403) error is thrown.

## Logging

Import the logger from `src/config/logger.js`. It is using the [Winston](https://github.com/winstonjs/winston) logging library.

Logging should be done according to the following severity levels (ascending order from most important to least important):

```javascript
const logger = require('<path to src>/config/logger');

logger.error('message'); // level 0
logger.warn('message'); // level 1
logger.info('message'); // level 2
logger.http('message'); // level 3
logger.verbose('message'); // level 4
logger.debug('message'); // level 5
```

In development mode, log messages of all severity levels will be printed to the console.

In production mode, only `info`, `warn`, and `error` logs will be printed to the console.\
It is up to the server (or process manager) to actually read them from the console and store them in log files.\
This app uses pm2 in production mode, which is already configured to store the logs in log files.

Note: API request information (request url, response code, timestamp, etc.) are also automatically logged (using [morgan](https://github.com/expressjs/morgan)).

## Linting

Linting & code formatting is done using [Biome](https://biomejs.dev). Please make sure you have installed the [VS Code Extention](https://marketplace.visualstudio.com/items?itemName=biomejs.biome) to make it work.

In this app, Biome is configured with some modifications.

To modify the Biome list & formatting configuration, update the `biome.json` file.

To prevent a certain file or directory from being linted, add it to `"ignore": ["**/node_modules", "**/bin"]` array.

To maintain a consistent coding style across different IDEs, the project contains `.editorconfig`


## Testing

This project uses **Vitest** for testing with **TypeScript** support. Docker is also used to provide a test database environment. Please follow these steps to add new test cases.

#### 1. Setting Up the Test Environment

Before adding tests, ensure that the Docker test database is running. Start it by running:

```bash
docker-compose -f docker-compose.only-db-test.yml up -d
```

You may also need to push your database schema to the test database:

```bash
pnpm db:push
```

#### 2. Organizing Test Files

All test files are organized within the `/tests` directory. Follow this structure:

```
tests/
 ├── fixtures/       # Sample data and mock files used across tests
 ├── integration/    # Integration tests for modules and components
 └── utils/          # Utility functions for tests, such as mocks and helpers
```

1. **Integration Tests**: Place tests that assess how different modules work together in `tests/integration`. Name these files with `.test.ts` or `.spec.ts` suffixes.

2. **Fixtures**: Place sample data and reusable mock files in `tests/fixtures`.

3. **Test Utilities**: Helper functions or utilities used across tests, such as mock functions, go in `tests/utils`.

#### 3. Writing Test Cases in TypeScript

Write tests following the **Arrange-Act-Assert (AAA)** pattern:

- **Arrange**: Set up test conditions and input.
- **Act**: Execute the function or module under test.
- **Assert**: Check the output or behavior.

For example, here’s a TypeScript test for a `createUser` function in `auth.service.ts`:

```typescript
// tests/integration/auth.service.test.ts
import { describe, it, expect } from 'vitest';
import { createUser } from '../../src/services/auth.service';

describe('Auth Service - createUser', () => {
  it('should create a new user with valid input', async () => {
    const input = { username: 'testuser', email: 'test@example.com' };
    const result = await createUser(input);
    expect(result).toHaveProperty('id');
    expect(result.username).toBe('testuser');
  });

  it('should throw an error if email is missing', async () => {
    const input = { username: 'testuser' };
    await expect(createUser(input)).rejects.toThrow('Email is required');
  });
});
```

#### 4. Mocking Dependencies

To mock dependencies or isolate functionality under test, use **Vitest**’s `vi.fn()` and place shared mocks in `tests/utils`.

Example:
```typescript
// tests/utils/mockDatabase.ts
import { vi } from 'vitest';
export const mockDatabaseCall = vi.fn().mockResolvedValue({ id: 1 });
```

#### 5. Running Tests

To run all tests:

```bash
pnpm test
```

To view a UI for test results (useful for debugging):

```bash
pnpm test:ui
```

To run tests with coverage:

```bash
pnpm coverage
```

#### 6. Writing Descriptive Tests

- **Use descriptive test names**: Clearly explain the expected behavior, e.g., “should create a new user with valid input.”
- **Cover edge cases**: Consider a variety of scenarios, such as invalid inputs or boundary values.

#### 7. Stopping the Test Database

After running tests, you can stop the Docker container for the test database:

```bash
docker-compose -f docker-compose.only-db-test.yml down
```

By following these guidelines, you can contribute well-structured and reliable tests to this project.

## Add New Functionality

This project follows a modular structure for components and routes, using **Express**, **Prisma** for data modeling, **Joi** for validation, and **TypeScript**. Follow these steps to create a new component/route.

#### 1. Define the Route and Controller

1. **Create a Route File**: Navigate to `src/routes` and create a new route file. For example, if you’re creating a new route for `products`, add a `products.route.ts` file.
  
   ```typescript
   // src/routes/products.route.ts
   import express from 'express';
   import { validate } from '../middlewares/validate';
   import productValidation from '../validations/product.validation';
   import productController from '../controllers/product.controller';

   const router = express.Router();

   router
     .route('/')
     .post(validate(productValidation.createProduct), productController.createProduct)
     .get(productController.getProducts);

   router
     .route('/:productId')
     .get(productController.getProduct)
     .patch(validate(productValidation.updateProduct), productController.updateProduct)
     .delete(productController.deleteProduct);

   export default router;
   ```

2. **Add Route to Main Router**: Register the new route in the main router (`src/routes/index.ts`):

   ```typescript
   import productRoute from './products.route';

   const router = express.Router();

   router.use('/products', productRoute);
   ```

#### 2. Create the Controller

Controllers are responsible for handling the logic of each route.

1. **Create a Controller File**: Add a new file in `src/controllers`, such as `product.controller.ts`.

   ```typescript
   // src/controllers/product.controller.ts
   import { Request, Response } from 'express';
   import { ProductService } from '../services/product.service';

   export const createProduct = async (req: Request, res: Response) => {
     const product = await ProductService.createProduct(req.body);
     res.status(201).json(product);
   };

   export const getProducts = async (req: Request, res: Response) => {
     const products = await ProductService.getProducts();
     res.json(products);
   };

   // Other controller functions for getProduct, updateProduct, deleteProduct
   ```

#### 3. Add Business Logic in the Service Layer

Add business logic functions for the component in `src/services`. This keeps the controller clean and separates the logic.

```typescript
// src/services/product.service.ts
import { prisma } from '../config/db';

export const createProduct = async (data: any) => {
  return prisma.product.create({ data });
};

export const getProducts = async () => {
  return prisma.product.findMany();
};

// Additional functions for updateProduct, deleteProduct, getProductById, etc.
```

#### 4. Define Validation Schemas

Add a Joi schema to validate request data in `src/validations`.

```typescript
// src/validations/product.validation.ts
import Joi from 'joi';

export const createProduct = Joi.object({
  name: Joi.string().required(),
  price: Joi.number().positive().required(),
  description: Joi.string().optional(),
});

export const updateProduct = Joi.object({
  name: Joi.string(),
  price: Joi.number().positive(),
  description: Joi.string(),
});
```

#### 5. Update Swagger Documentation

To document the new route, update the API documentation by adding Swagger definitions in `src/docs`. You can include comments in `product.route.ts` like this:

```typescript
/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Product created
 *       400:
 *         description: Validation error
 */
```

#### 6. Test the New Route

Write integration tests for the new component in `tests/integration`. Ensure that each route is tested for success and failure cases.

```typescript
// tests/integration/product.route.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('Product Routes', () => {
  it('should create a new product', async () => {
    const res = await request(app).post('/v1/products').send({
      name: 'Test Product',
      price: 19.99,
    });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
  });

  // Additional tests for get, update, delete
});
```

By following these steps, you can create, validate, and document new components/routes effectively within the project.