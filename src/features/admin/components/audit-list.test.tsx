import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { AdminAuditEvent } from "@/features/admin/queries";
import { AuditList } from "./audit-list";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useFormatter: () => ({ dateTime: () => "1 Jan 2026, 10:00" }),
}));

const event: AdminAuditEvent = {
  id: "e0000000-0000-0000-0000-000000000001",
  occurredAt: "2026-10-29T10:00:00.000Z",
  actorRole: "owner",
  action: "post.removed",
  targetType: "post",
  targetId: "a0000000-0000-0000-0000-000000000001",
  reason: "Spam link",
  metadata: { before: "visible", after: "removed" },
};

describe("AuditList", () => {
  it("opens a row in a dialog and shows the event JSON", async () => {
    const user = userEvent.setup();
    render(<AuditList events={[event]} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /post\.removed/ }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/"before": "visible"/)).toBeInTheDocument();
    expect(screen.getByText(/"after": "removed"/)).toBeInTheDocument();
  });

  it("closes the dialog again", async () => {
    const user = userEvent.setup();
    render(<AuditList events={[event]} />);

    await user.click(screen.getByRole("button", { name: /post\.removed/ }));
    await user.click(screen.getAllByRole("button", { name: "close" })[0]);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
