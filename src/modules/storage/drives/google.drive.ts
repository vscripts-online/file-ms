import { drive_v3, google } from 'googleapis';
import * as ms from 'ms';
import { BaseDrive } from './base.drive';
import { IAccountSchema, IFilePartSchema } from 'src/database';

export class GoogleDrive extends BaseDrive {
  async get_drive(): Promise<drive_v3.Drive> {
    const account = this.account;

    const oAuth2Client = new google.auth.OAuth2(
      account.client_id,
      account.client_secret,
    );
    oAuth2Client.setCredentials({
      refresh_token: account.refresh_token,
      access_token: account.access_token,
    });
    const expire_time = (account.access_token_expiry_time || 0) - Date.now();

    if (expire_time < ms('5 min')) {
      console.log('access_token expired');
      const {
        credentials: { access_token, expiry_date },
      } = await oAuth2Client.refreshAccessToken();
      this.accountRepository.set_access_token(
        String(account._id),
        access_token,
        expiry_date,
      );
      oAuth2Client.setCredentials({
        refresh_token: account.refresh_token,
        access_token,
      });
    }

    const drive = google.drive({ version: 'v3', auth: oAuth2Client });
    return drive;
  }

  async get_storage_sizes(): Promise<
    Pick<IAccountSchema, 'storage_size' | 'available_size'>
  > {
    const drive = await this.get_drive();
    const { data } = await drive.about.get({ fields: 'storageQuota' });

    const storage_size = Number(data?.storageQuota?.limit) || 0;
    const available_size =
      storage_size - Number(data?.storageQuota?.usage) || 0;

    return { storage_size, available_size };
  }

  async get_file(file_part: IFilePartSchema) {
    const drive = await this.get_drive();
    const { data } = await drive.files.get(
      { fileId: file_part.id, alt: 'media' },
      { responseType: 'stream' },
    );
    return data;
  }
}
