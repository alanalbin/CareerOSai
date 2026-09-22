import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb, schema } from "../../server/db";
import { eq, desc, and } from "drizzle-orm";

export const notificationsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    return db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, ctx.user.id))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(30);
  }),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      await db
        .update(schema.notifications)
        .set({ read: true })
        .where(and(eq(schema.notifications.id, input.id), eq(schema.notifications.userId, ctx.user.id)));
      return { success: true };
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    await db
      .update(schema.notifications)
      .set({ read: true })
      .where(eq(schema.notifications.userId, ctx.user.id));
    return { success: true };
  }),
});
