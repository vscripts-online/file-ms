import { Prop } from '@nestjs/mongoose';

export interface IFilePartSchema {
  owner: string;
  name: string;
  offset: number;
  size: number;
  id: string;
}

export class FilePartSchema {
  @Prop({ nullable: false })
  owner: string;

  @Prop({ nullable: false })
  name: string;

  @Prop({ nullable: false })
  offset: number;

  @Prop({ nullable: false })
  size: number;

  @Prop({ nullable: false })
  id: string;
}
