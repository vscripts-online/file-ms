import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { MONGO_URI } from './common';
import { DatabaseModule } from './database/database.module';
import { AccountModule, FileModule } from './modules';

@Module({
  imports: [
    MongooseModule.forRoot(MONGO_URI, { dbName: 'vscr-cdn' }),
    DatabaseModule,
    FileModule,
    AccountModule,
  ],
})
export class AppModule {}
