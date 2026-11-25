const { execFileSync } = require("node:child_process");
const path = require("node:path");

const provider = process.env.PRISMA_PROVIDER;
const schema =
  provider === "postgresql"
    ? "schema.postgresql.prisma"
    : "schema.prisma";

execFileSync(
  process.execPath,
  [
    require.resolve("prisma"),
    "generate",
    "--schema",
    path.join("prisma", schema),
  ],
  { stdio: "inherit" },
);
