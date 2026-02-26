/**
 * Unit tests for UserService (no DB)
 * Works with your current src/services/user.service.ts:
 * - class UserService has INSTANCE methods (register/login)
 * - userRepo is created at module load: const userRepo = new UserRepository()
 * So we MUST mock UserRepository BEFORE importing the service.
 */

const getByEmail = jest.fn();
const getById = jest.fn();
const create = jest.fn();
const updateProfilePicture = jest.fn();
const updateById = jest.fn();

jest.mock("../../../repositories/user.repository", () => {
  return {
    UserRepository: jest.fn().mockImplementation(() => ({
      getByEmail,
      getById,
      create,
      updateProfilePicture,
      updateById,
    })),
  };
});

const hash = jest.fn();
const compare = jest.fn();

jest.mock("bcryptjs", () => ({
  __esModule: true,
  default: {
    hash: (...args: any[]) => hash(...args),
    compare: (...args: any[]) => compare(...args),
  },
}));

const sign = jest.fn();

jest.mock("jsonwebtoken", () => ({
  __esModule: true,
  default: {
    sign: (...args: any[]) => sign(...args),
  },
}));

// IMPORTANT: Your user.service.ts imports JWT_SECRET from "../config"
jest.mock("../../../config", () => ({
  JWT_SECRET: "unit-test-secret",
}));

// Import AFTER mocks
import { UserService } from "../../../services/user.service";

describe("UserService unit", () => {
  let service: UserService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UserService();
  });

  describe("register()", () => {
    it("throws 409 if email already registered", async () => {
      getByEmail.mockResolvedValue({ _id: "u1", email: "a@test.com" });

      await expect(
        service.register({
          fullName: "Test",
          email: "a@test.com",
          countryCode: "+977",
          phone: "9800000000",
          address: "KTM",
          password: "Password@123!",
        } as any)
      ).rejects.toMatchObject({ statusCode: 409 });

      expect(getByEmail).toHaveBeenCalledWith("a@test.com");
      expect(create).not.toHaveBeenCalled();
    });

    it("hashes password and creates user when new email", async () => {
      getByEmail.mockResolvedValue(null);
      hash.mockResolvedValue("hashed-pass");

      const createdUser = { _id: "u2", email: "b@test.com", role: "user" };
      create.mockResolvedValue(createdUser);

      const result = await service.register({
        fullName: "B",
        email: "b@test.com",
        countryCode: "+977",
        phone: "9800000000",
        address: "KTM",
        password: "Password@123!",
      } as any);

      expect(getByEmail).toHaveBeenCalledWith("b@test.com");
      expect(hash).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledTimes(1);

      // Ensure create payload contains hashed password
      expect(create.mock.calls[0][0]).toMatchObject({
        email: "b@test.com",
        password: "hashed-pass",
        role: "user",
      });

      expect(result).toEqual(createdUser);
    });
  });

  describe("login()", () => {
    it("throws 404 if user not found", async () => {
      getByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: "no@test.com", password: "Password@123!" } as any)
      ).rejects.toMatchObject({ statusCode: 404 });

      expect(getByEmail).toHaveBeenCalledWith("no@test.com");
      expect(compare).not.toHaveBeenCalled();
      expect(sign).not.toHaveBeenCalled();
    });

    it("throws 401 if password mismatch", async () => {
      getByEmail.mockResolvedValue({
        _id: "u3",
        email: "c@test.com",
        password: "hashed",
        role: "user",
      });

      compare.mockResolvedValue(false);

      await expect(
        service.login({ email: "c@test.com", password: "Wrong@123" } as any)
      ).rejects.toMatchObject({ statusCode: 401 });

      expect(compare).toHaveBeenCalledTimes(1);
      expect(sign).not.toHaveBeenCalled();
    });

    it("returns safe user + token on success", async () => {
      const user = {
        _id: "u4",
        email: "d@test.com",
        password: "hashed",
        role: "user",
      };

      getByEmail.mockResolvedValue(user);
      compare.mockResolvedValue(true);
      sign.mockReturnValue("jwt-token");

      const safeUser = { _id: "u4", email: "d@test.com", role: "user" };
      getById.mockResolvedValue(safeUser);

      const result = await service.login({
        email: "d@test.com",
        password: "Password@123!",
      } as any);

      expect(sign).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ user: safeUser, token: "jwt-token" });
    });
  });
});