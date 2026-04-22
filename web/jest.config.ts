import { createDefaultPreset, pathsToModuleNameMapper } from "ts-jest";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { compilerOptions } = require("./tsconfig.json");

const tsJestTransformCfg = createDefaultPreset().transform;

export default {
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          ...compilerOptions,
          skipLibCheck: true,
          types: [...(compilerOptions.types ?? []), "jest", "node"],
          ignoreDeprecations: "6.0",
        },
        diagnostics: {
          ignoreDiagnostics: [5107],
        },
      },
    ],
  },
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths ?? {}, {
      prefix: "<rootDir>/",
    }),
    "^@/prisma/generated/client$":
      "<rootDir>/tests/__mocks__/prisma-client.mock.ts",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup/jest.setup.ts"],
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
};
