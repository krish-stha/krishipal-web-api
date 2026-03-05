/**
 * Unit tests for UserService forgotPassword/resetPassword (no DB)
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

// Mock config import used by service
jest.mock("../../../config", () => ({
  JWT_SECRET: "unit-test-secret",
}));

// bcrypt default import in your code
const hash = jest.fn();
jest.mock("bcryptjs", () => ({
  __esModule: true,
  default: {
    hash: (...args: any[]) => hash(...args),
    compare: jest.fn(),
  },
}));

// mail service
const sendResetEmail = jest.fn();
jest.mock("../../../services/mail.service", () => ({
  sendResetEmail: (...args: any[]) => sendResetEmail(...args),
}));

// crypto used inside service
const randomBytes = jest.fn();
const createHash = jest.fn();

jest.mock("crypto", () => ({
  __esModule: true,
  default: {
    randomBytes: (...args: any[]) => randomBytes(...args),
    createHash: (...args: any[]) => createHash(...args),
  },
}));

// UserModel used directly inside forgot/reset
const findOne = jest.fn();
jest.mock("../../../models/user.model", () => ({
  UserModel: {
    findOne: (...args: any[]) => findOne(...args),
  },
}));

import { UserService } from "../../../services/user.service";

describe("UserService password reset unit", () => {
  let service: UserService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UserService();

    process.env.FRONTEND_URL = "http://localhost:3000";
  });

  describe("forgotPassword()", () => {
    it("returns success message even if user not found (no enumeration)", async () => {
      findOne.mockResolvedValue(null);

      const result = await service.forgotPassword("missing@test.com");

      expect(result).toEqual({
        message: "If your email exists, a reset link has been sent.",
      });
      expect(sendResetEmail).not.toHaveBeenCalled();
    });

    it("stores token hash + expiry and sends reset email when user exists", async () => {
      // crypto.randomBytes -> raw token hex
      randomBytes.mockReturnValue({
        toString: () => "raw-token-hex",
      });

      // crypto.createHash(...).update(...).digest(...)
      const digest = jest.fn().mockReturnValue("token-hash");
      const update = jest.fn().mockReturnValue({ digest });
      createHash.mockReturnValue({ update });

      const save = jest.fn().mockResolvedValue(true);

      const userDoc: any = {
        email: "user@test.com",
        deleted_at: null,
        reset_password_token: null,
        reset_password_expires_at: null,
        save,
      };

      findOne.mockResolvedValue(userDoc);

      const result = await service.forgotPassword("user@test.com");

      expect(userDoc.reset_password_token).toBe("token-hash");
      expect(userDoc.reset_password_expires_at).toBeInstanceOf(Date);
      expect(save).toHaveBeenCalledTimes(1);

      expect(sendResetEmail).toHaveBeenCalledTimes(1);
      const [emailArg, linkArg] = sendResetEmail.mock.calls[0];
      expect(emailArg).toBe("user@test.com");
      expect(String(linkArg)).toContain(
        "/auth/reset-password?token=raw-token-hex"
      );

      expect(result).toEqual({ message: "Reset email sent successfully." });
    });
  });

  describe("resetPassword()", () => {
    it("throws 400 if token invalid/expired", async () => {
      // make tokenHash
      const digest = jest.fn().mockReturnValue("token-hash");
      const update = jest.fn().mockReturnValue({ digest });
      createHash.mockReturnValue({ update });

      findOne.mockResolvedValue(null);

      await expect(
        service.resetPassword("raw-token", "NewPass@123!")
      ).rejects.toMatchObject({ statusCode: 400 });

      expect(findOne).toHaveBeenCalledTimes(1);
    });

    it("hashes new password, clears token fields, saves user", async () => {
      const digest = jest.fn().mockReturnValue("token-hash");
      const update = jest.fn().mockReturnValue({ digest });
      createHash.mockReturnValue({ update });

      hash.mockResolvedValue("new-hashed");

      const save = jest.fn().mockResolvedValue(true);

      const userDoc: any = {
        password: "old-hashed",
        reset_password_token: "token-hash",
        reset_password_expires_at: new Date(Date.now() + 100000),
        deleted_at: null,
        save,
      };

      findOne.mockResolvedValue(userDoc);

      const result = await service.resetPassword("raw-token", "NewPass@123!");

      expect(userDoc.password).toBe("new-hashed");
      expect(userDoc.reset_password_token).toBeNull();
      expect(userDoc.reset_password_expires_at).toBeNull();
      expect(save).toHaveBeenCalledTimes(1);

      expect(result).toEqual({ message: "Password reset successful" });
    });
  });
});