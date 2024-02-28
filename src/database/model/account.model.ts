import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseSchema } from './base.model';

export enum AccountTypes {
  GOOGLE = 'GOOGLE',
}

export interface IAccountSchema {
  _id?: Types.ObjectId;
  type: AccountTypes;
  label?: string;
  client_id?: string;
  client_secret?: string;
  code?: string;
  refresh_token?: string;
  access_token?: string;
  access_token_expiry_time?: number;
  storage_size: number;
  available_size: number;
}

@Schema({ collection: 'account' })
export class AccountSchema extends BaseSchema implements IAccountSchema {
  @Prop({ enum: AccountTypes })
  type: AccountTypes;

  @Prop({ nullable: true })
  label?: string;

  @Prop({ nullable: true })
  client_id?: string;

  @Prop({ nullable: true })
  client_secret?: string;

  @Prop({ nullable: true })
  code?: string;

  @Prop({ nullable: true })
  refresh_token?: string;

  @Prop({ nullable: true })
  access_token?: string;

  @Prop({ nullable: true })
  access_token_expiry_time?: number;

  @Prop({ default: 0 })
  storage_size: number;

  @Prop({ default: 0 })
  available_size: number;
}

export const AccountSchemaClass = SchemaFactory.createForClass(AccountSchema);
