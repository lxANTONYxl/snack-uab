import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, client } from '../apps/api/src/db';
await migrate(db, { migrationsFolder: './drizzle' });
await client.end();
console.log('Migraciones aplicadas.');
