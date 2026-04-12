import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

config({ path: path.resolve(__dirname, '../../.env') });
config({ path: path.resolve(__dirname, '../../../../.env') });

const databaseUrl = process.env.DATABASE_URL;
const databaseHost = process.env.DB_HOST ?? '';
const requiresSsl =
  process.env.NODE_ENV === 'production' ||
  process.env.DB_SSL === 'true' ||
  databaseUrl?.includes('sslmode=require') ||
  databaseUrl?.includes('.neon.tech') ||
  databaseHost.includes('.neon.tech');

const baseOptions = {
  type: 'postgres' as const,
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
  entities: [path.join(__dirname, '/entities/**/*.{ts,js}')],
  migrations: [path.join(__dirname, '/migrations/**/*.{ts,js}')],
  migrationsTableName: 'migrations',
  ssl: requiresSsl
    ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true' }
    : false,
};

export const AppDataSource = new DataSource(
  databaseUrl
    ? {
        ...baseOptions,
        url: databaseUrl,
      }
    : {
        ...baseOptions,
        host: databaseHost,
        port: parseInt(process.env.DB_PORT ?? '5432', 10),
        username: process.env.DB_USER ?? process.env.DB_USERNAME,
        password: process.env.DB_PASS ?? process.env.DB_PASSWORD,
        database: process.env.DB_NAME ?? process.env.DB_DATABASE,
      },
);
