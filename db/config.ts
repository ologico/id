import { defineDb, defineTable, column } from "astro:db";

const Cred = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    publicKey: column.text(),
    signCount: column.number()
  }
});

const GitHub = defineTable({
  columns: {
    humanId: column.text({ primaryKey: true }),
    githubId: column.text(),
    username: column.text(),
    accessToken: column.text(),
    linkedAt: column.date()
  }
});

export default defineDb({
  tables: { Cred, GitHub }
});
