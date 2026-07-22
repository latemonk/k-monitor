import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob("../**/*.ts");
type TestUser = ReturnType<ReturnType<typeof convexTest>["withIdentity"]>;

const USER = {
  subject: "user-tests-notification-channels",
  tokenIdentifier: "clerk|user-tests-notification-channels",
};

async function seedEntitlement(
  t: ReturnType<typeof convexTest>,
  tier = 1,
  validUntil = Date.now() + 30 * 24 * 60 * 60 * 1000,
) {
  await t.run(async (ctx) => {
    const existing = await ctx.db
      .query("entitlements")
      .withIndex("by_userId", (q) => q.eq("userId", USER.subject))
      .unique();
    const entitlement = {
      userId: USER.subject,
      planKey: tier >= 1 ? "pro_monthly" : "free",
      features: {
        tier,
        maxDashboards: 10,
        apiAccess: true,
        apiRateLimit: 1000,
        prioritySupport: true,
        exportFormats: ["json", "csv"],
      },
      validUntil,
      updatedAt: Date.now(),
    };
    if (existing) {
      await ctx.db.replace(existing._id, entitlement);
    } else {
      await ctx.db.insert("entitlements", entitlement);
    }
  });
}

describe("notificationChannels — Convex entitlement gate", () => {
  const guardedMutations: Array<[string, (asUser: TestUser) => Promise<unknown>]> = [
    ["setChannel", (asUser: TestUser) =>
      asUser.mutation(api.notificationChannels.setChannel, {
        channelType: "email",
        email: "free-user@example.com",
      })],
    ["deleteChannel", (asUser: TestUser) =>
      asUser.mutation(api.notificationChannels.deleteChannel, {
        channelType: "email",
      })],
    ["deactivateChannel", (asUser: TestUser) =>
      asUser.mutation(api.notificationChannels.deactivateChannel, {
        channelType: "email",
      })],
    ["createPairingToken", (asUser: TestUser) =>
      asUser.mutation(api.notificationChannels.createPairingToken, {
        variant: "full",
      })],
  ];

  describe.each([
    ["missing", async (_t: ReturnType<typeof convexTest>) => {
      // Intentionally leave the entitlement table empty.
    }],
    ["expired", (t: ReturnType<typeof convexTest>) =>
      seedEntitlement(t, 1, Date.now() - 1_000)],
    ["tier-0", (t: ReturnType<typeof convexTest>) => seedEntitlement(t, 0)],
  ])("%s entitlement", (_entitlementState, arrangeEntitlement) => {
    test.each(guardedMutations)(
      "%s rejects an authenticated non-Pro caller",
      async (_name, invoke) => {
        const t = convexTest(schema, modules);
        await arrangeEntitlement(t);
        const asUser = t.withIdentity(USER);

        await expect(invoke(asUser)).rejects.toThrow(
          /PRO_REQUIRED|Notifications are a PRO feature/i,
        );
      },
    );
  });

  test("claimPairingToken rejects a token whose owner is no longer Pro", async () => {
    const t = convexTest(schema, modules);
    await seedEntitlement(t);
    const asProUser = t.withIdentity(USER);
    const pairing = await asProUser.mutation(
      api.notificationChannels.createPairingToken,
      { variant: "full" },
    );
    await seedEntitlement(t, 1, Date.now() - 1_000);

    await expect(
      t.mutation(api.notificationChannels.claimPairingToken, {
        token: pairing.token,
        chatId: "12345",
      }),
    ).resolves.toEqual({ ok: false, reason: "PRO_REQUIRED" });

    const state = await t.run(async (ctx) => ({
      token: await ctx.db
        .query("telegramPairingTokens")
        .withIndex("by_token", (q) => q.eq("token", pairing.token))
        .unique(),
      channels: await ctx.db
        .query("notificationChannels")
        .withIndex("by_user", (q) => q.eq("userId", USER.subject))
        .collect(),
    }));
    expect(state.token?.used).toBe(false);
    expect(state.channels).toEqual([]);
  });

  test("PRO callers retain access to every entitlement-gated public mutation", async () => {
    const t = convexTest(schema, modules);
    await seedEntitlement(t);
    const asProUser = t.withIdentity(USER);

    await asProUser.mutation(api.notificationChannels.setChannel, {
      channelType: "email",
      email: "pro-user@example.com",
    });
    await asProUser.mutation(api.notificationChannels.deactivateChannel, {
      channelType: "email",
    });
    await asProUser.mutation(api.notificationChannels.deleteChannel, {
      channelType: "email",
    });
    const pairing = await asProUser.mutation(
      api.notificationChannels.createPairingToken,
      { variant: "full" },
    );
    const claimed = await t.mutation(
      api.notificationChannels.claimPairingToken,
      { token: pairing.token, chatId: "12345" },
    );

    const channels = await asProUser.query(
      api.notificationChannels.getChannels,
      {},
    );
    expect(pairing.token).toHaveLength(43);
    expect(claimed).toEqual({ ok: true, reason: null });
    expect(channels).toMatchObject([
      { channelType: "telegram", chatId: "12345", verified: true },
    ]);
  });
});
