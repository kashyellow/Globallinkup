import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { AdminAuditEvent } from "@/features/admin/queries";
import { AuditList } from "./audit-list";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useFormatter: () => ({
    dateTime: () => "1 Jan 2026, 10:00",
    relativeTime: () => "2 hours ago",
  }),
}));

const event: AdminAuditEvent = {
  id: "e0000000-0000-0000-0000-000000000001",
  occurredAt: "2026-10-29T10:00:00.000Z",
  actorRole: "owner",
  action: "post.removed",
  targetType: "post",
  targetId: "a0000000-0000-0000-0000-000000000001",
  reason: "Spam link",
  metadata: {
    before: { state: "visible", moderation_status: "visible", review: "manual" },
    after: { state: "removed", moderation_status: "removed", review: "manual" },
  },
};

describe("AuditList", () => {
  it("opens a row in a dialog and shows the event JSON", async () => {
    const user = userEvent.setup();
    render(<AuditList events={[event]} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /post\.removed/ }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("before")).toBeInTheDocument();
    expect(screen.getByText("after")).toBeInTheDocument();
    expect(screen.getByText("eventJson")).toBeInTheDocument();
    expect(screen.getByText(/"action": "post\.removed"/)).toBeInTheDocument();

    const jsonLines = Array.from(document.querySelectorAll("pre span"));
    const changedLine = jsonLines.find((line) => line.textContent?.includes('"state": "removed"'));
    expect(changedLine).toHaveClass("bg-admin-surface");
    const unchangedLine = jsonLines.find((line) =>
      line.textContent?.includes('"review": "manual"'),
    );
    expect(unchangedLine).toBeDefined();
    expect(unchangedLine).not.toHaveClass("bg-admin-surface");
  });

  it("shows how long ago an event happened and flags destructive actions", () => {
    render(<AuditList events={[event]} />);

    expect(screen.getByText("2 hours ago")).toBeInTheDocument();
    expect(screen.getByText("post.removed")).toHaveClass("text-danger-text");
  });

  it("closes the dialog again", async () => {
    const user = userEvent.setup();
    render(<AuditList events={[event]} />);

    await user.click(screen.getByRole("button", { name: /post\.removed/ }));
    await user.click(screen.getAllByRole("button", { name: "close" })[0]);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
