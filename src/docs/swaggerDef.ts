import config from "../config/config";

const swaggerDef = {
  openapi: "3.0.0",
  info: {
    title: `Express Boilerplate API Documentation`,
    version: "1.0.0",
    license: {
      name: "MIT",
      url: "https://github.com/D2RTECHDEV/express_starter_kit",
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}/v1`,
    },
  ],
};

export default swaggerDef;
