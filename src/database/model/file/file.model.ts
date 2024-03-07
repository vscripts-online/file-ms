import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from '../base.model';
import { FileHeaderSchema } from './file_header.model';
import { FilePartSchema } from './file_part.model';

export interface IFileSchema {
  _id?: string;
  name: string;
  original_name: string;
  mime_type: string;
  size: number;
  slug: string;
  parts?: FilePartSchema[];
  headers?: FileHeaderSchema[];
  user: number;
}

@Schema({
  collection: 'file',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class FileSchema extends BaseSchema implements IFileSchema {
  @Prop({ nullable: false })
  name: string;

  @Prop({ nullable: false })
  original_name: string;

  @Prop({ nullable: false })
  mime_type: string;

  @Prop({ nullable: false })
  size: number;

  @Prop({ nullable: false, unique: true })
  slug: string;

  @Prop({ defaul: false })
  loading_from_cloud_now: boolean;

  @Prop({ type: FileHeaderSchema, default: [] })
  headers: FileHeaderSchema[];

  @Prop({ type: FilePartSchema, default: [] })
  parts?: FilePartSchema[];

  @Prop({ nullable: false })
  user: number;
}

export const FileSchemaClass = SchemaFactory.createForClass(FileSchema);
