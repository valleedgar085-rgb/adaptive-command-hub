import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { MainMenu } from "./MainMenu";
import { describe, it, expect, vi } from "vitest";

describe("MainMenu", () => {
  const mockOnNewChat = vi.fn();
  const mockOnOpenSettings = vi.fn();
  const mockOnSignOut = vi.fn();

  const renderMainMenu = () => {
    return render(
      <BrowserRouter>
        <MainMenu
          onNewChat={mockOnNewChat}
          onOpenSettings={mockOnOpenSettings}
          onSignOut={mockOnSignOut}
        />
      </BrowserRouter>
    );
  };

  it("renders all menu triggers", () => {
    renderMainMenu();

    expect(screen.getByText("File")).toBeInTheDocument();
    expect(screen.getByText("View")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Help")).toBeInTheDocument();
  });

  it("renders menubar component", () => {
    const { container } = renderMainMenu();

    // Check that the menubar is rendered
    const menubar = container.querySelector('[role="menubar"]');
    expect(menubar).toBeInTheDocument();
  });
});
