import { PluggyClient } from "pluggy-sdk";

const cleanEnv = (val?: string) =>
  (val || "").replace(/^["']|["']$/g, "").trim();

const clientId = cleanEnv(
  process.env.PLUGGY_CLIENT_ID || process.env.CLIENT_ID,
);
const clientSecret = cleanEnv(
  process.env.PLUGGY_CLIENT_SECRET || process.env.CLIENT_SECRET,
);

export const pluggyClient = new PluggyClient({
  clientId,
  clientSecret,
});
