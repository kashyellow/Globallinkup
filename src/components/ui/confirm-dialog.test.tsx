import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ConfirmDialog } from "./confirm-dialog";

function renderDialog(props: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) {
  const onConfirm = vi.fn();
  render(
    <ConfirmDialog
      open
      title="Delete?"
      body="Gone for good."
      confirmLabel="Delete forever"
      cancelLabel="Cancel"
      onConfirm={onConfirm}
      onClose={() => {}}
      {...props}
    />,
  );
  return { onConfirm };
}

describe("ConfirmDialog", () => {
  it("renders children inside the dialog", () => {
    renderDialog({ children: <input aria-label="Type DELETE" /> });
    expect(screen.getByRole("alertdialog")).toContainElement(screen.getByLabelText("Type DELETE"));
  });

  it("disables the confirm button while confirmDisabled", async () => {
    const { onConfirm } = renderDialog({ confirmDisabled: true });
    const button = screen.getByRole("button", { name: "Delete forever" });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("confirms when confirmDisabled is false", async () => {
    const { onConfirm } = renderDialog({ confirmDisabled: false });
    await userEvent.click(screen.getByRole("button", { name: "Delete forever" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
