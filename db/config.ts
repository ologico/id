import { defineDb, defineTable, column } from "astro:db";

const Cred = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    publicKey: column.text(),
    signCount: column.number()
  }
});

export default defineDb({
  tables: { Cred }
});
