import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProfilePicker } from "@/components/ProfilePicker";

describe("ProfilePicker", () => {
  it("renders one entry per child profile", () => {
    render(
      <ProfilePicker
        children={[
          { id: "1", name: "Alex", avatar: "🤖" },
          { id: "2", name: "Sam", avatar: "🚀" },
        ]}
      />
    );
    expect(screen.getByText("Alex")).toBeInTheDocument();
    expect(screen.getByText("Sam")).toBeInTheDocument();
  });

  it("shows a PIN prompt when a profile is selected", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    render(<ProfilePicker children={[{ id: "1", name: "Alex", avatar: "🤖" }]} />);
    await user.click(screen.getByText("Alex"));
    expect(screen.getByPlaceholderText("Enter PIN")).toBeInTheDocument();
  });
});
