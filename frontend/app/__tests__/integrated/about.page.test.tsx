import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

// ✅ adjust this to your actual path
import AboutPage from "@/app/user/dashboard/about/page";

const getPublicSettingsMock = jest.fn();
jest.mock("@/lib/api/settings", () => ({
  getPublicSettings: () => getPublicSettingsMock(),
}));

const getPublicAboutMock = jest.fn();
jest.mock("@/lib/api/about", () => ({
  getPublicAbout: () => getPublicAboutMock(),
}));

// next/image -> img
jest.mock("next/image", () => {
  return ({ alt, src, ...props }: any) => <img alt={alt} src={src} {...props} />;
});

// Header/Footer -> simple markers
jest.mock("@/app/user/component/header", () => ({
  Header: () => <div data-testid="header">Header</div>,
}));
jest.mock("@/app/user/component/footer", () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}));

describe("AboutPage", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, NEXT_PUBLIC_BACKEND_URL: "https://api.example.com" };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  test("renders header/footer and default fallback content initially", async () => {
    // Make APIs fail/return nothing so defaults stay
    getPublicSettingsMock.mockRejectedValueOnce(new Error("settings fail"));
    getPublicAboutMock.mockRejectedValueOnce(new Error("about fail"));

    render(<AboutPage />);

    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();

    // Default storeName is KrishiPal -> About KrishiPal
    expect(screen.getByRole("heading", { name: /about krishipal/i })).toBeInTheDocument();

    // Default mission/vision titles exist
    expect(screen.getByRole("heading", { name: /our mission/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /our vision/i })).toBeInTheDocument();

    // Default images are local fallbacks
    const missionImg = screen.getByAltText("Mission") as HTMLImageElement;
    const visionImg = screen.getByAltText("Vision") as HTMLImageElement;

    expect(missionImg.src).toContain("/images/farmers-working-in-green-rice-paddy-field.png");
    expect(visionImg.src).toContain("/images/modern-greenhouse-agricultural-technology.png");

    // ensure api calls happened
    await waitFor(() => {
      expect(getPublicSettingsMock).toHaveBeenCalledTimes(1);
      expect(getPublicAboutMock).toHaveBeenCalledTimes(1);
    });
  });

  test("uses storeName from settings if about.heroTitle not provided", async () => {
    getPublicSettingsMock.mockResolvedValueOnce({ data: { storeName: "Namaste Agro" } });
    getPublicAboutMock.mockResolvedValueOnce({ data: {} }); // no heroTitle -> fallback uses storeName

    render(<AboutPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /about namaste agro/i })).toBeInTheDocument();
    });
  });

  test("renders about content + socials and builds backend image URLs", async () => {
    getPublicSettingsMock.mockResolvedValueOnce({ data: { storeName: "KrishiPal" } });
    getPublicAboutMock.mockResolvedValueOnce({
      data: {
        heroTitle: "About Our Platform",
        heroDescription: "We empower farmers with products and support.",
        missionTitle: "Mission Custom",
        missionBody: "Mission body custom",
        visionTitle: "Vision Custom",
        visionBody: "Vision body custom",
        missionImage: "mission.png",
        visionImage: "vision.png",
        socials: [
          { label: "Facebook", url: "https://facebook.com/krishipal" },
          { label: "Website", url: "https://krishipal.com" },
        ],
      },
    });

    render(<AboutPage />);

    // Wait for async updates
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /about our platform/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/we empower farmers/i)).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: /mission custom/i })).toBeInTheDocument();
    expect(screen.getByText(/mission body custom/i)).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: /vision custom/i })).toBeInTheDocument();
    expect(screen.getByText(/vision body custom/i)).toBeInTheDocument();

    // Social links
    const fb = screen.getByRole("link", { name: /facebook/i });
    expect(fb).toHaveAttribute("href", "https://facebook.com/krishipal");

    const web = screen.getByRole("link", { name: /website/i });
    expect(web).toHaveAttribute("href", "https://krishipal.com");

    // Images should be converted to backendPublic about/<filename>
    const missionImg = screen.getByAltText("Mission") as HTMLImageElement;
    const visionImg = screen.getByAltText("Vision") as HTMLImageElement;

    expect(missionImg.src).toBe("https://api.example.com/public/about/mission.png");
    expect(visionImg.src).toBe("https://api.example.com/public/about/vision.png");
  });

  test("handles absolute image URLs without modifying them", async () => {
    getPublicSettingsMock.mockResolvedValueOnce({ data: { storeName: "KrishiPal" } });
    getPublicAboutMock.mockResolvedValueOnce({
      data: {
        missionImage: "https://cdn.example.com/m.png",
        visionImage: "https://cdn.example.com/v.png",
      },
    });

    render(<AboutPage />);

    await waitFor(() => {
      // Just ensure something updated (about loaded)
      expect(getPublicAboutMock).toHaveBeenCalledTimes(1);
    });

    const missionImg = screen.getByAltText("Mission") as HTMLImageElement;
    const visionImg = screen.getByAltText("Vision") as HTMLImageElement;

    expect(missionImg.src).toBe("https://cdn.example.com/m.png");
    expect(visionImg.src).toBe("https://cdn.example.com/v.png");
  });
});