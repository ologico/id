import { defineDb, defineTable, column } from "astro:db";

const Cred = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    locale: column.text()
  }
});

export default defineDb({
  tables: { Cred }
});
