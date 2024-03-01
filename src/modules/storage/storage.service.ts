import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { google } from 'googleapis';
import { Document } from 'mongoose';
import * as stream from 'node:stream';
import { AccountTypes } from 'pb/account/AccountTypes';
import { REDIRECT_URI_GOOGLE } from 'src/common';
import { IAccountSchema, IFilePartSchema } from 'src/database';
import { AccountRepository } from 'src/database/repository/account.repository';
import { GoogleDrive } from './drives';

export interface AccountLoginState {
  _id: string;
  client_id: string;
  client_secret: string;
}

@Injectable()
export class StorageService {
  @Inject(forwardRef(() => AccountRepository))
  private readonly accountRepository: AccountRepository;

  private get_storage(account: IAccountSchema) {
    switch (account.type) {
      case AccountTypes.GOOGLE:
        return new GoogleDrive({
          account,
          accountRepository: this.accountRepository,
        });

      default:
        break;
    }
  }

  async upload(account: IAccountSchema, name: string, stream: stream.Readable) {
    const drive = await this.get_storage(account).get_drive();

    try {
      const file = await drive.files.create({
        media: { body: stream },
        fields: 'id',
        requestBody: { name },
      });

      return file.data.id;
    } catch (err) {
      console.error('Error on uploading listing files:', err);
      return false;
    }
  }

  async get_storage_sizes(account: IAccountSchema) {
    return this.get_storage(account).get_storage_sizes();
  }

  async get_file_from_storage(account: IAccountSchema, file: IFilePartSchema) {
    return this.get_storage(account).get_file(file);
  }

  async get_login_url_google(account: IAccountSchema) {
    const oAuth2Client = new google.auth.OAuth2(
      account.client_id,
      account.client_secret,
      REDIRECT_URI_GOOGLE,
    );

    const account_login_state: AccountLoginState = {
      _id: account._id.toString(),
      client_id: account.client_id,
      client_secret: account.client_secret,
    };

    const url = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/drive'],
      include_granted_scopes: true,
      state: encodeURIComponent(JSON.stringify(account_login_state)),
    });

    return url;
  }

  async callback_google(account: Document & IAccountSchema) {
    const oAuth2Client = new google.auth.OAuth2(
      account.client_id,
      account.client_secret,
      REDIRECT_URI_GOOGLE,
    );

    const { tokens } = await oAuth2Client.getToken({ code: account.code });
    console.log('tokens', tokens);

    account.access_token = tokens.access_token || account.access_token;
    account.refresh_token = tokens.refresh_token || account.refresh_token;
    account.access_token_expiry_time =
      tokens.expiry_date || account.access_token_expiry_time;

    const { available_size, storage_size } =
      await this.get_storage_sizes(account);

    account.storage_size = storage_size;
    account.available_size = available_size;

    return account.save();
  }
}
