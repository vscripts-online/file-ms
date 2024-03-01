import { Prop } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BaseDocument = BaseSchema & Document;

export class BaseSchema extends Document {
  @Prop({ type: Date, required: true, default: new Date() })
  time: Date;
}
