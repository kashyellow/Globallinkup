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
  it("names each dialog by its own title when two are on the page", () => {
    const props = { open: true, cancelLabel: "Cancel", onConfirm: () => {}, onClose: () => {} };
    render(
      <>
        <ConfirmDialog
          {...props}
          title="Delete this post?"
          body="Post body"
          confirmLabel="Delete"
        />
        <ConfirmDialog
          {...props}
          title="Delete your profile?"
          body="Profile body"
          confirmLabel="Go"
        />
      </>,
    );
    expect(
      screen.getByRole("alertdialog", { name: "Delete your profile?" }),
    ).toHaveAccessibleDescription("Profile body");
    expect(
      screen.getByRole("alertdialog", { name: "Delete this post?" }),
    ).toHaveAccessibleDescription("Post body");
  });

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
