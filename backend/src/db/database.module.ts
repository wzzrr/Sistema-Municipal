import { Global, Module } from '@nestjs/common';
import { Pool } from 'pg';

@Global()
@Module({
  providers: [
    { provide: 'PG', useFactory: async () => new Pool({ connectionString: process.env.DATABASE_URL }) },
  ],
  exports: ['PG'],
})
export class DatabaseModule {}
