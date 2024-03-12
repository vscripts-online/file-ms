import { Controller, Inject, forwardRef } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { nanoid } from 'nanoid';
import { CreateFilePartRequestDTO__Output } from 'pb/file/CreateFilePartRequestDTO';
import { CreateFileRequestDTO__Output } from 'pb/file/CreateFileRequestDTO';
import { File, File__Output } from 'pb/file/File';
import { FilePart__Output } from 'pb/file/FilePart';
import { FileServiceHandlers } from 'pb/file/FileService';
import { GetBySlugRequestDTO__Output } from 'pb/file/GetBySlugRequestDTO';
import { GetFilesRequestDTO__Output } from 'pb/file/GetFilesRequestDTO';
import { SetLoadingRequestDTO__Output } from 'pb/file/SetLoadingRequestDTO';
import { BytesValue } from 'pb/google/protobuf/BytesValue';
import { Int32Value } from 'pb/google/protobuf/Int32Value';
import { Observable, Subject, from } from 'rxjs';
import { GrpcService } from 'src/common/type';
import { FileRepository, IAccountSchema } from 'src/database';
import { AccountController } from '../account';
import { StorageService } from '../storage/storage.service';
import { UpdateFileRequestDTO__Output } from 'pb/file/UpdateFileRequestDTO';

const SERVICE_NAME = 'FileService';

@Controller()
export class FileController implements GrpcService<FileServiceHandlers> {
  [x: string]: (data: any) => Promise<any> | Promise<unknown>;

  @Inject(forwardRef(() => FileRepository))
  // @ts-ignore
  private readonly fileRepository: FileRepository;

  @Inject(forwardRef(() => AccountController))
  // @ts-ignore
  private readonly accountController: AccountController;

  @Inject(forwardRef(() => StorageService))
  // @ts-ignore
  private readonly storageService: StorageService;

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
    const file = this.fileRepository.new_file({
      ...data,
      slug,
      size: parseInt(data.size),
    });
    return file;
  }

  @GrpcMethod(SERVICE_NAME)
  async GetBySlug(data: GetBySlugRequestDTO__Output): Promise<File> {
    const file = await this.fileRepository.findOne(data);
    if (!file) {
      throw new RpcException('File not found');
    }
    return file;
  }

  @GrpcMethod(SERVICE_NAME)
  async CreateFilePart(
    data: CreateFilePartRequestDTO__Output,
  ): Promise<Int32Value> {
    const { _id, part } = data;
    const response = await this.fileRepository.create_file_part(_id, {
      ...part,
      offset: parseInt(part.offset),
      size: parseInt(part.size),
    });
    return { value: response.modifiedCount };
  }

  @GrpcMethod(SERVICE_NAME)
  async GetFiles(data: GetFilesRequestDTO__Output): Promise<Observable<File>> {
    const { limit: _limit, sort_by, where } = data;
    const { limit, skip } = _limit || {};

    if (where.created_at?.gte) {
      where.created_at['$gte'] = where.created_at.gte;
      delete where.created_at.gte;
    }

    if (where.created_at?.lte) {
      where.created_at['$lte'] = where.created_at.lte;
      delete where.created_at.lte;
    }

    if (where.updated_at?.gte) {
      where.updated_at['$gte'] = where.updated_at.gte;
      delete where.updated_at.gte;
    }

    if (where.updated_at?.lte) {
      where.updated_at['$lte'] = where.updated_at.lte;
      delete where.updated_at.lte;
    }

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

  @GrpcMethod(SERVICE_NAME)
  async GetFileFromStorage(
    file: File__Output,
  ): Promise<Observable<BytesValue>> {
    await this.SetLoading({ _id: file._id, loading_from_cloud_now: true });
    const sorted_file_parts =
      file.parts?.sort((a, b) => parseInt(a.offset) - parseInt(b.offset)) || [];
    if (sorted_file_parts.length === 0) {
      throw new RpcException('There is no file parts');
    }
    const response = new Subject<BytesValue>();

    this.pipe_cloud_to_response(sorted_file_parts, response);

    return response.asObservable();
  }

  @GrpcMethod(SERVICE_NAME)
  async UpdateFile(data: UpdateFileRequestDTO__Output): Promise<File> {
    const file = await this.fileRepository.update(data);
    if (!file) {
      throw new RpcException('File not found');
    }

    return file;
  }

  // @ts-ignore
  private async pipe_cloud_to_response(
    sorted_file_parts: FilePart__Output[],
    response: Subject<BytesValue>,
  ) {
    for (const file_part of sorted_file_parts) {
      await new Promise(async (resolve, reject) => {
        const account = await this.accountController.GetAccount({
          value: file_part.owner,
        });

        const cloud_stream = await this.storageService.get_file_from_storage(
          account as IAccountSchema,
          {
            ...file_part,
            offset: parseInt(file_part.offset),
            size: parseInt(file_part.size),
          },
        );

        cloud_stream.on('data', (data) => {
          response.next({ value: data });
        });

        cloud_stream.on('error', (error) => {
          response.error(error);
          reject(error);
        });

        cloud_stream.on('end', () => {
          resolve(undefined);
        });
      });
    }

    response.complete();
  }
}
