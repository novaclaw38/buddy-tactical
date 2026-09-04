import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MissionClient } from "@/app/mission/MissionClient";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    json: async () => ({ orb_text: "Acknowledged, Cadet.", audio_base64: null, rank: 1, ranked_up: false, mission_complete: false }),
  }));
});

describe("MissionClient", () => {
  it("shows tap-to-answer options when microphone access is denied", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: vi.fn().mockRejectedValue(new Error("denied")) },
      configurable: true,
    });

    const user = userEvent.setup();
    render(<MissionClient childName="Alex" course="robotics" />);

    await user.pointer({ keys: "[MouseLeft>]", target: screen.getByText("Hold to Talk") });

    await waitFor(() => {
      expect(screen.getByText("Option A")).toBeInTheDocument();
      expect(screen.getByText("Option B")).toBeInTheDocument();
    });
  });

  it("submits a tap answer without recording audio", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: vi.fn().mockRejectedValue(new Error("denied")) },
      configurable: true,
    });

    const user = userEvent.setup();
    render(<MissionClient childName="Alex" course="robotics" />);
    await user.pointer({ keys: "[MouseLeft>]", target: screen.getByText("Hold to Talk") });
    await waitFor(() => screen.getByText("Option A"));

    await user.click(screen.getByText("Option A"));

    await waitFor(() => {
      expect(screen.getByText((text) => text.includes("Acknowledged, Cadet."))).toBeInTheDocument();
    });
  });
});
