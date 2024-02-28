import { Controller, Inject, forwardRef } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Account } from 'pb/account/Account';
import { AccountServiceHandlers } from 'pb/account/AccountService';
import { AccountTypes } from 'pb/account/AccountTypes';
import { AccountUpdateGoogleRequestDTO__Output } from 'pb/account/AccountUpdateGoogleRequestDTO';
import { NewAccountRequestDTO__Output } from 'pb/account/NewAccountRequestDTO';
import { PaginationRequestDTO__Output } from 'pb/account/PaginationRequestDTO';
import {
  StringValue,
  StringValue__Output,
} from 'pb/google/protobuf/StringValue';
import { Observable, from } from 'rxjs';
import { GrpcService } from 'src/common/type';
import { AccountRepository } from 'src/database';
import { StorageService } from '../storage/storage.service';

const SERVICE_NAME = 'AccountService';

@Controller()
export class AccountController implements GrpcService<AccountServiceHandlers> {
  [x: string]: (data: any) => any;

  @Inject(forwardRef(() => AccountRepository))
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  private readonly accountRepository: AccountRepository;

  @Inject(forwardRef(() => StorageService))
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  private readonly storageService: StorageService;

  @GrpcMethod(SERVICE_NAME)
  async NewAccount(data: NewAccountRequestDTO__Output): Promise<Account> {
    const { type, label } = data;
    console.log(data);
    const account = await this.accountRepository.new_account(type, label);
    return account;
  }

  @GrpcMethod(SERVICE_NAME)
  async DeleteAccount(data: StringValue__Output): Promise<Account> {
    const { value } = data;
    const response = await this.accountRepository.delete_file_by_id(value);
    return response;
  }

  @GrpcMethod(SERVICE_NAME)
  async GetAccounts(
    data: PaginationRequestDTO__Output,
  ): Promise<Observable<Account>> {
    const accounts = await this.accountRepository.get_accounts(data);
    return from(accounts);
  }

  @GrpcMethod(SERVICE_NAME)
  async LoginUrlGoogle(
    data: AccountUpdateGoogleRequestDTO__Output,
  ): Promise<StringValue> {
    const { _id, client_id, client_secret } = data;
    const account = await this.accountRepository.get_account_by_id(_id);
    if (account.type !== AccountTypes.GOOGLE) {
      throw new Error('Account type is not GOOGLE');
    }

    account.client_id = client_id;
    account.client_secret = client_secret;

    const value = await this.storageService.get_login_url_google(account);

    return { value };
  }
}
