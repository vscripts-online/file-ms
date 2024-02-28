import { Controller, Inject, forwardRef } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { nanoid } from 'nanoid';
import { CreateFilePartRequestDTO__Output } from 'pb/file/CreateFilePartRequestDTO';
import { CreateFileRequestDTO__Output } from 'pb/file/CreateFileRequestDTO';
import { File } from 'pb/file/File';
import { FileServiceHandlers } from 'pb/file/FileService';
import { GetBySlugRequestDTO__Output } from 'pb/file/GetBySlugRequestDTO';
import { GetFilesRequestDTO__Output } from 'pb/file/GetFilesRequestDTO';
import { SetLoadingRequestDTO__Output } from 'pb/file/SetLoadingRequestDTO';
import { Int32Value } from 'pb/google/protobuf/Int32Value';
import { Observable, from } from 'rxjs';
import { GrpcService } from 'src/common/type';
import { FileRepository } from 'src/database';

const SERVICE_NAME = 'FileService';

@Controller()
export class FileController implements GrpcService<FileServiceHandlers> {
  [x: string]: (data: any) => Promise<any> | Promise<unknown>;

  @Inject(forwardRef(() => FileRepository))
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  private readonly fileRepository: FileRepository;

  private async createSlug() {
    const slug = nanoid(8);
    if (
      ['-', '_'].includes(slug[0]) ||
      ['-', '_'].includes(slug[slug.length - 1])
    ) {
      return this.createSlug();
    }
    const exists = await this.fileRepository.is_slug_exists(slug);
    if (exists) {
      return this.createSlug();
    }
    return slug;
  }

  @GrpcMethod(SERVICE_NAME)
  async CreateFile(data: CreateFileRequestDTO__Output): Promise<File> {
    const slug = await this.createSlug();
    const file = this.fileRepository.new_file({ ...data, slug });
    return file;
  }
  @GrpcMethod(SERVICE_NAME)
  async GetBySlug(data: GetBySlugRequestDTO__Output): Promise<File> {
    const file = await this.fileRepository.findOne(data);
    return file;
  }
  async CreateFilePart(
    data: CreateFilePartRequestDTO__Output,
  ): Promise<Int32Value> {
    console.log(data);
    return { value: 123 };
  }

  @GrpcMethod(SERVICE_NAME)
  async GetFiles(data: GetFilesRequestDTO__Output): Promise<Observable<File>> {
    const { limit: _limit, sort_by, where } = data;
    const { limit, skip } = _limit || {};
    const files = await this.fileRepository.get_files(
      where,
      { limit, skip },
      sort_by,
    );

    return from(files);
  }

  @GrpcMethod(SERVICE_NAME)
  async SetLoading(data: SetLoadingRequestDTO__Output): Promise<Int32Value> {
    const { _id, loading_from_cloud_now } = data;
    const response = await this.fileRepository.set_loading_from_cloud_now(
      _id,
      loading_from_cloud_now,
    );
    return { value: response.modifiedCount };
  }
}
