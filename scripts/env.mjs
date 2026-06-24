import { existsSync } from "node:fs";
import { config } from "dotenv";

const envFiles = [".env.local", ".env"].filter((path) => existsSync(path));

if (envFiles.length > 0) {
  config({ path: envFiles, quiet: true });
}
