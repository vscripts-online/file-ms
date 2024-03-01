import { Prop } from '@nestjs/mongoose';

export interface IFileHeaderSchema {
  key: string;
  value: string;
}

export class FileHeaderSchema {
  @Prop({ nullable: false })
  key: string;

  @Prop({ nullable: false })
  value: string;
}
