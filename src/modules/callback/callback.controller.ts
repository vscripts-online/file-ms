import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  Query,
  forwardRef,
} from '@nestjs/common';
import { google } from 'googleapis';
import { AccountTypes } from 'pb/account/AccountTypes';
import { AccountRepository } from 'src/database';
import { AccountLoginState, StorageService } from '../storage/storage.service';
import { REDIRECT_URI_GOOGLE } from 'src/common';

@Controller('/callback_google')
export class CallbackController {
  @Inject(forwardRef(() => AccountRepository))
  private readonly accountRepository: AccountRepository;

  @Inject(forwardRef(() => StorageService))
  private readonly storageService: StorageService;

  @Get('/')
  async callback_google(
    @Query('state') state: string,
    @Query('code') code: string,
  ) {
    const { _id, client_id, client_secret } = JSON.parse(
      decodeURIComponent(state),
    ) as AccountLoginState;

    const account = await this.accountRepository.get_account_by_id(_id);
    if (!account) {
      throw new BadRequestException('Account not found');
    }

    if (account.type !== AccountTypes.GOOGLE) {
      throw new BadRequestException('Invalid id');
    }

    if (!client_id || !client_secret) {
      throw new BadRequestException('Client id or client secret is invalid');
    }

    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      REDIRECT_URI_GOOGLE,
    );

    const { tokens } = await oAuth2Client.getToken({ code });
    console.log('tokens', tokens);

    account.client_id = client_id;
    account.client_secret = client_secret;
    account.code = code || account.code;
    account.access_token = tokens.access_token || account.access_token;
    account.refresh_token = tokens.refresh_token || account.refresh_token;
    account.access_token_expiry_time =
      tokens.expiry_date || account.access_token_expiry_time;

    const { available_size, storage_size } =
      await this.storageService.get_storage_sizes(account);

    account.storage_size = storage_size;
    account.available_size = available_size;

    return account.save();
  }
}
