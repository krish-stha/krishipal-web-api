// jest.setup.ts
import realFs from "fs";

jest.mock("fs", () => {
  // real Node fs
  const fs = jest.requireActual("fs") as typeof import("fs");

  return {
    __esModule: true,
    default: fs, 
    ...fs,      
  };
});

jest.spyOn(console, "log").mockImplementation(() => {});