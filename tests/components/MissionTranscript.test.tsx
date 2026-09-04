import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MissionTranscript } from "@/components/MissionTranscript";

describe("MissionTranscript", () => {
  it("renders each turn's content in order", () => {
    render(
      <MissionTranscript
        turns={[
          { role: "orb", content: "Cadet, report your status." },
          { role: "child", content: "All systems go." },
        ]}
      />
    );
    expect(screen.getByText((text) => text.includes("Cadet, report your status."))).toBeInTheDocument();
    expect(screen.getByText((text) => text.includes("All systems go."))).toBeInTheDocument();
  });
});
