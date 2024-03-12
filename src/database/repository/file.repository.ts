import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, ProjectionType, QueryOptions } from 'mongoose';
import { FileSchema, IFilePartSchema, IFileSchema } from '../model';
import { UpdateFileRequestDTO__Output } from 'pb/file/UpdateFileRequestDTO';

@Injectable()
export class FileRepository {
  @InjectModel(FileSchema.name) private readonly model: Model<FileSchema>;

  // async get_by_id(_id: string) {
  //   return this.model.findOne({ _id });
  // }

  async findOne(
    filter: FilterQuery<FileSchema>,
    projection?: ProjectionType<FileSchema>,
    options?: QueryOptions<FileSchema>,
  ) {
    return this.model.findOne<FileSchema>(filter, projection, options);
  }

  async update(params: UpdateFileRequestDTO__Output) {
    const { _id, file_name, headers, user } = params;
    return this.model.findOneAndUpdate<FileSchema>(
      { _id, user },
      { file_name, headers },
    );
  }

  async is_slug_exists(slug: string) {
    return this.model.exists({ slug });
  }

  async new_file(file: IFileSchema) {
    return this.model.create(file);
  }

  async create_file_part(_id: string, file_part: IFilePartSchema) {
    return this.model.updateOne(
      { _id },
      { $push: { parts: { ...file_part } } },
    );
  }

  // async get_unsynced_files() {
  //   return this.model
  //     .find({ 'parts.0': { $exists: false } })
  //     .select('name')
  //     .lean();
  // }

  // async delete_file_by_id(_id: string) {
  //   return this.model.deleteOne({ _id });
  // }

  async set_loading_from_cloud_now(
    _id: string,
    loading_from_cloud_now: boolean,
  ) {
    return this.model.updateOne({ _id }, { loading_from_cloud_now });
  }

  async get_files(
    where: Partial<IFileSchema> = {},
    params = { skip: 0, limit: 20 },
    sort_by: string = '',
  ) {
    let { limit, skip } = params || { skip: 0, limit: 20 };

    if (!limit) {
      limit = 20;
    }

    if (!skip) {
      skip = 0;
    }

    return await this.model
      .find(where)
      .skip(skip)
      .limit(limit)
      .sort(sort_by || undefined);
  }
}
