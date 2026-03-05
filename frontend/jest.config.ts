import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  // ✅ now matches app/__tests__/
  testMatch: [
    "<rootDir>/app/__tests__/**/*.test.(ts|tsx)",
    "<rootDir>/app/__tests__/**/*.spec.(ts|tsx)",
  ],

  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^.+\\.module\\.(css|sass|scss)$": "identity-obj-proxy",
    "^.+\\.(css|sass|scss)$": "<rootDir>/app/__tests__/__mocks__/styleMock.ts",
    "^.+\\.(png|jpg|jpeg|gif|webp|avif|ico|bmp)$":
      "<rootDir>/app/__tests__/__mocks__/fileMock.ts",
    "^.+\\.svg$": "<rootDir>/app/__tests__/__mocks__/svgMock.ts",
  },
};

export default createJestConfig(config);