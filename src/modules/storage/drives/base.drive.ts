import { drive_v3 } from 'googleapis';
import {
  AccountRepository,
  IAccountSchema,
  IFilePartSchema,
} from 'src/database';
import { Readable } from 'stream';

type DriveTypes = drive_v3.Drive;

export interface BaseDriveParams {
  account: IAccountSchema;
  accountRepository: AccountRepository;
}

export abstract class BaseDrive {
  protected account: IAccountSchema;
  protected accountRepository: AccountRepository;

  constructor(params: BaseDriveParams) {
    const { account, accountRepository } = params;
    this.account = account;
    this.accountRepository = accountRepository;
  }

  abstract get_drive(): Promise<DriveTypes>;
  abstract get_storage_sizes(): Promise<
    Pick<IAccountSchema, 'storage_size' | 'available_size'>
  >;
  abstract get_file(file_part: IFilePartSchema): Promise<Readable>;
}
