import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { MONGO_URI } from './common';
import { DatabaseModule } from './database/database.module';
import { AccountModule, FileModule } from './modules';
import { CallbackModule } from './modules/callback/callback.module';
import { StorageModule } from './modules/storage/storage.module';

@Module({
  imports: [
    MongooseModule.forRoot(MONGO_URI, { dbName: 'vscr-cdn' }),
    DatabaseModule,
    FileModule,
    AccountModule,
    CallbackModule,
    StorageModule,
  ],
})
export class AppModule {}
