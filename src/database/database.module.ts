import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AccountSchema,
  AccountSchemaClass,
  FileSchema,
  FileSchemaClass,
} from './model';
import { AccountRepository } from './repository/account.repository';
import { FileRepository } from './repository/file.repository';

const schemas = [
  { name: AccountSchema.name, schema: AccountSchemaClass },
  { name: FileSchema.name, schema: FileSchemaClass },
];

const providers = [AccountRepository, FileRepository];

@Global()
@Module({
  imports: [MongooseModule.forFeature(schemas)],
  providers,
  exports: [MongooseModule.forFeature(schemas), ...providers],
})
export class DatabaseModule {}
