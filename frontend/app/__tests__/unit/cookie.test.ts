import Cookies from "js-cookie";
import {
  setAuthCookies,
  updateUserCookie,
  getToken,
  getUser,
  clearAuthCookies,
} from "@/lib/cookie";

jest.mock("js-cookie", () => ({
  set: jest.fn(),
  get: jest.fn(),
  remove: jest.fn(),
}));

describe("lib/cookie.ts", () => {
  const setMock = Cookies.set as unknown as jest.Mock;
  const getMock = Cookies.get as unknown as jest.Mock;
  const removeMock = Cookies.remove as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("setAuthCookies stores user+token and dispatches event", () => {
    const dispatchSpy = jest.spyOn(window, "dispatchEvent");

    setAuthCookies(
      { id: "1", email: "a@b.com", name: "A", role: "user" },
      "tok"
    );

    expect(setMock).toHaveBeenCalledWith(
      "krishipal_user",
      JSON.stringify({ id: "1", email: "a@b.com", name: "A", role: "user" }),
      expect.objectContaining({ path: "/", sameSite: "lax" })
    );

    expect(setMock).toHaveBeenCalledWith(
      "krishipal_token",
      "tok",
      expect.objectContaining({ path: "/", sameSite: "lax" })
    );

    expect(dispatchSpy).toHaveBeenCalled();
  });

  test("getToken returns token from cookie", () => {
    getMock.mockReturnValueOnce("tok123");
    expect(getToken()).toBe("tok123");
  });

  test("getUser returns parsed user or null if missing/invalid", () => {
    getMock.mockReturnValueOnce(
      JSON.stringify({ id: "1", email: "a@b.com", name: "A", role: "user" })
    );
    expect(getUser()).toEqual({ id: "1", email: "a@b.com", name: "A", role: "user" });

    getMock.mockReturnValueOnce(undefined);
    expect(getUser()).toBeNull();

    getMock.mockReturnValueOnce("not-json");
    expect(getUser()).toBeNull();
  });

  test("updateUserCookie merges + dispatches event", () => {
    const dispatchSpy = jest.spyOn(window, "dispatchEvent");

    getMock.mockReturnValueOnce(
      JSON.stringify({ id: "1", email: "a@b.com", name: "A", role: "user" })
    );

    updateUserCookie({ name: "New Name", profile_picture: "p.png" });

    expect(setMock).toHaveBeenCalledWith(
      "krishipal_user",
      JSON.stringify({
        id: "1",
        email: "a@b.com",
        name: "New Name",
        role: "user",
        profile_picture: "p.png",
      }),
      expect.objectContaining({ path: "/", sameSite: "lax" })
    );

    expect(dispatchSpy).toHaveBeenCalled();
  });

  test("clearAuthCookies removes cookies and dispatches event", () => {
    const dispatchSpy = jest.spyOn(window, "dispatchEvent");

    clearAuthCookies();

    expect(removeMock).toHaveBeenCalledWith("krishipal_token", { path: "/" });
    expect(removeMock).toHaveBeenCalledWith("krishipal_user", { path: "/" });
    expect(dispatchSpy).toHaveBeenCalled();
  });
});