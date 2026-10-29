import { describe, expect, it } from "vitest";

import { commentSnapshot, productSnapshot, reportSnapshot, roleSnapshot } from "./audit-snapshots";

describe("audit snapshots", () => {
  it("keeps product state and drops content fields", () => {
    expect(
      productSnapshot(
        {
          catalog_status: "live",
          is_published: true,
          published_at: "2026-10-01T00:00:00.000Z",
          deleted_at: null,
          price_cents: 4500,
          currency: "USD",
        },
        3,
      ),
    ).toEqual({
      status: "live",
      is_published: true,
      published_at: "2026-10-01T00:00:00.000Z",
      deleted_at: null,
      price_cents: 4500,
      currency: "USD",
      image_count: 3,
    });
  });

  it("resolves the reported target from the report type", () => {
    const base = {
      status: "open",
      resolved_at: null,
      target_type: "post",
      target_user_id: null,
      target_post_id: "post-1",
    };
    expect(reportSnapshot(base)).toMatchObject({
      reported_type: "post",
      reported_id: "post-1",
    });
    expect(reportSnapshot({ ...base, target_type: "user", target_user_id: "u1" })).toMatchObject({
      reported_type: "user",
      reported_id: "u1",
    });
  });

  it("snapshots comment deletion and sorts role capabilities", () => {
    expect(commentSnapshot({ post_id: "p1", deleted_at: null })).toEqual({
      post_id: "p1",
      deleted_at: null,
    });
    expect(
      roleSnapshot({ slug: "moderator", capabilities: ["posts.moderate", "audit.read"] }),
    ).toEqual({
      slug: "moderator",
      capabilities: ["audit.read", "posts.moderate"],
    });
  });
});
