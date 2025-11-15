import { defineDb, defineTable, column } from "astro:db";

const Cred = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    publicKey: column.text(),
    signCount: column.number()
  }
});

const OAuthClient = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    name: column.text(),
    clientId: column.text(),
    clientSecret: column.text(),
    authUrl: column.text(),
    tokenUrl: column.text(),
    userInfoUrl: column.text(),
    scopes: column.text(),
    createdAt: column.date()
  }
});

const OAuthConnection = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    humanId: column.text(),
    clientId: column.text({ references: () => OAuthClient.columns.id }),
    providerId: column.text(),
    username: column.text(),
    accessToken: column.text(),
    refreshToken: column.text({ optional: true }),
    linkedAt: column.date()
  },
  indexes: {
    humanClientUnique: { on: ["humanId", "clientId"], unique: true }
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
  tables: { Cred, OAuthClient, OAuthConnection, GitHub }
});
