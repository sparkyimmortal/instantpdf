import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { users } from "../shared/schema";

const email = process.argv[2];

if (!email) {
  console.error("Usage: npm run make-admin <email>");
  console.error("Example: npm run make-admin user@example.com");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL environment variable is not set.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function makeAdmin() {
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      console.error(`ERROR: No user found with email "${email}"`);
      process.exit(1);
    }

    if (user.role === "admin") {
      console.log(`User "${email}" is already an admin.`);
      process.exit(0);
    }

    await db.update(users).set({ role: "admin" }).where(eq(users.id, user.id));

    console.log(`SUCCESS: User "${email}" has been promoted to admin.`);
  } catch (error: any) {
    console.error("ERROR:", error.message || error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

makeAdmin();
