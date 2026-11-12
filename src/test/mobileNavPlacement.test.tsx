import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LogIn } from "lucide-react";
import { MobileTabBar, CANDIDATE_NAV, PUBLIC_NAV } from "@/components/edura/AppShell";

const renderBar = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe("mobile navigation placement", () => {
  it("sits pinned to the bottom of the screen and hides on desktop", () => {
    const { container } = renderBar(
      <MobileTabBar items={PUBLIC_NAV} center={{ icon: LogIn, label: "Get started", onClick: () => {} }} />,
    );
    const dock = container.querySelector("nav");
    expect(dock).not.toBeNull();
    const wrapper = dock!.parentElement!;
    expect(wrapper.className).toMatch(/fixed/);
    expect(wrapper.className).toMatch(/bottom-0/);
    expect(wrapper.className).toMatch(/lg:hidden/);
  });

  it("gives visitors public destinations plus a sign-in action", () => {
    renderBar(
      <MobileTabBar items={PUBLIC_NAV} center={{ icon: LogIn, label: "Get started", onClick: () => {} }} />,
    );
    expect(screen.getByRole("link", { name: /Home/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /Practice/i })).toHaveAttribute("href", "/demo");
    expect(screen.getByRole("link", { name: /Services/i })).toHaveAttribute("href", "/services");
    expect(screen.getByRole("link", { name: /Pricing/i })).toHaveAttribute("href", "/payment");
    expect(screen.getByRole("button", { name: "Get started" })).toBeInTheDocument();
  });

  it("gives signed-in students the app destinations", () => {
    renderBar(<MobileTabBar items={CANDIDATE_NAV} center={{ icon: LogIn, label: "Explore", onClick: () => {} }} />);
    expect(screen.getByRole("link", { name: /Home/i })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: /CBT/i })).toHaveAttribute("href", "/cbt");
    expect(screen.getByRole("link", { name: /Services/i })).toHaveAttribute("href", "/services");
    expect(screen.getByRole("link", { name: /Wallet/i })).toHaveAttribute("href", "/wallet");
  });
});
