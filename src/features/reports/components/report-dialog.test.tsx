import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ReportDialog } from "./report-dialog";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/features/reports/actions", () => ({
  createReportAction: vi.fn(() => new Promise(() => {})),
}));

describe("ReportDialog", () => {
  it("locks the form and exposes a pending state while sending", async () => {
    const user = userEvent.setup();

    render(
      <ReportDialog
        target={{ type: "post", id: "post-1", name: "A post" }}
        open
        onClose={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: "submit" }));

    const submit = screen.getByRole("button", { name: /sending/ });
    expect(submit).toBeDisabled();
    expect(submit).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("radio", { name: "reasons.inappropriate" })).toBeDisabled();
    expect(document.querySelector("form")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
