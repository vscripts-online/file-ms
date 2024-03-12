/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Metadata } from '@grpc/grpc-js';
import { Controller, Inject, Injectable, forwardRef } from '@nestjs/common';
import {
  GrpcMethod,
  GrpcStreamMethod,
  RpcException,
} from '@nestjs/microservices';
import * as crypto from 'node:crypto';
import * as stream from 'node:stream';
import { Account } from 'pb/account/Account';
import { AccountServiceHandlers } from 'pb/account/AccountService';
import { AccountTypes } from 'pb/account/AccountTypes';
import { AccountUpdateGoogleRequestDTO__Output } from 'pb/account/AccountUpdateGoogleRequestDTO';
import { CallbackGoogleRequestDTO__Output } from 'pb/account/CallbackGoogleRequestDTO';
import { IncreaseSizeRequestDTO__Output } from 'pb/account/IncreaseSizeRequestDTO';
import { NewAccountRequestDTO__Output } from 'pb/account/NewAccountRequestDTO';
import { PaginationRequestDTO__Output } from 'pb/account/PaginationRequestDTO';
import { TotalStorageResponse } from 'pb/account/TotalStorageResponse';
import { UploadRequestDTO__Output } from 'pb/account/UploadRequestDTO';
import {
  StringValue,
  StringValue__Output,
} from 'pb/google/protobuf/StringValue';
import { UInt32Value } from 'pb/google/protobuf/UInt32Value';
import { UInt64Value__Output } from 'pb/google/protobuf/UInt64Value';
import { Observable, from } from 'rxjs';
import { GrpcService } from 'src/common/type';
import { AccountRepository } from 'src/database';
import { StorageService } from '../storage/storage.service';
import { BoolValue__Output } from 'pb/google/protobuf/BoolValue';
import { UpdateLabelDTO__Output } from 'pb/account/UpdateLabelDTO';

const SERVICE_NAME = 'AccountService';

@Injectable()
@Controller()
export class AccountController implements GrpcService<AccountServiceHandlers> {
  [x: string]: (data: any) => any;

  @Inject(forwardRef(() => AccountRepository))
  // @ts-ignore
  private readonly accountRepository: AccountRepository;

  @Inject(forwardRef(() => StorageService))
  // @ts-ignore
  private readonly storageService: StorageService;

  @GrpcMethod(SERVICE_NAME)
  async NewAccount(data: NewAccountRequestDTO__Output): Promise<Account> {
    const { type, label } = data;
    const account = await this.accountRepository.new_account(type, label);
    return account;
  }

  @GrpcMethod(SERVICE_NAME)
  async DeleteAccount(data: StringValue__Output): Promise<Account> {
    const { value } = data;
    const account = await this.accountRepository.delete_file_by_id(value);
    if (!account) {
      throw new RpcException('Account not found');
    }
    return account;
  }

  @GrpcMethod(SERVICE_NAME)
  async GetAccounts(
    data: PaginationRequestDTO__Output,
  ): Promise<Observable<Account>> {
    const accounts = await this.accountRepository.get_accounts(data);
    return from(accounts);
  }

  @GrpcMethod(SERVICE_NAME)
  async GetAccount(data: StringValue__Output): Promise<Account> {
    const account = await this.accountRepository.get_account_by_id(data.value);
    return account;
  }

  @GrpcMethod(SERVICE_NAME)
  async LoginUrlGoogle(
    data: AccountUpdateGoogleRequestDTO__Output,
  ): Promise<StringValue> {
    const { _id, client_id, client_secret } = data;
    const account = await this.accountRepository.get_account_by_id(_id);
    if (!account) {
      throw new RpcException('Account not found');
    }

    if (account.type !== AccountTypes.GOOGLE) {
      throw new RpcException('Account type is not GOOGLE');
    }

    account.client_id = client_id;
    account.client_secret = client_secret;

    const value = await this.storageService.get_login_url_google(account);

    return { value };
  }

  @GrpcMethod(SERVICE_NAME)
  async CallbackGoogle(
    data: CallbackGoogleRequestDTO__Output,
  ): Promise<Account> {
    const { _id, client_id, client_secret, code } = data;

    const account = await this.accountRepository.get_account_by_id(_id);
    if (!account) {
      throw new RpcException('Account not found');
    }

    if (account.type !== AccountTypes.GOOGLE) {
      throw new RpcException('Invalid id');
    }

    if (!client_id || !client_secret || !code) {
      throw new RpcException('Client id or client secret or code is invalid');
    }

    account.client_id = client_id;
    account.client_secret = client_secret;
    account.code = code;

    return this.storageService.callback_google(account);
  }

  @GrpcMethod(SERVICE_NAME)
  async PickBySize(data: UInt64Value__Output): Promise<Account> {
    const { value } = data;

    const account =
      await this.accountRepository.get_by_available_size_and_decrease(
        Number(value),
      );

    if (!account) {
      throw new RpcException('There is no account for this available size');
    }

    return account;
  }

  @GrpcMethod(SERVICE_NAME)
  async IncreaseSize(
    data: IncreaseSizeRequestDTO__Output,
  ): Promise<UInt32Value> {
    const { _id, size } = data;

    const response = await this.accountRepository.increase_available_size(
      _id,
      size,
    );

    return { value: response.modifiedCount };
  }

  @GrpcStreamMethod(SERVICE_NAME)
  //@ts-ignore
  async Upload(
    data: Observable<UploadRequestDTO__Output>,
    metadata: Metadata,
  ): Promise<StringValue__Output> {
    const [account_id] = metadata.get('account');
    const account = await this.accountRepository.get_account_by_id(
      account_id as string,
    );

    const pass_through = new stream.PassThrough();

    data.subscribe({
      async next(value) {
        pass_through.write(value.buffer);
      },
      complete() {
        pass_through.end();
      },
      error(err) {
        console.log('error', err);
      },
    });

    const file_id = await this.storageService.upload(
      account,
      crypto.randomUUID(),
      pass_through,
    );
    if (!file_id) {
      console.log('file_id error', file_id);
      throw new RpcException('Error on uploading file');
    }

    return { value: file_id };
  }

  @GrpcMethod(SERVICE_NAME)
  async TotalStorage(): Promise<TotalStorageResponse> {
    const count = await this.accountRepository.get_total_storage();
    return count;
  }

  @GrpcMethod(SERVICE_NAME)
  async UpdateLabel(data: UpdateLabelDTO__Output): Promise<BoolValue__Output> {
    const { _id, label } = data;
    const response = await this.accountRepository.update_label(_id, label);
    return { value: response };
  }
}
