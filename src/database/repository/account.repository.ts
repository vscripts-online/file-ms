import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AccountSchema, IAccountSchema } from '../model';
import { AccountTypes__Output } from 'pb/account/AccountTypes';
import { TotalStorageResponse } from 'pb/account/TotalStorageResponse';

@Injectable()
export class AccountRepository {
  @InjectModel(AccountSchema.name) private readonly model: Model<AccountSchema>;

  async new_account(type: AccountTypes__Output, label?: string) {
    return await this.model.create({ type, label });
  }

  async sync_size(
    _id: string,
    params: Pick<IAccountSchema, 'storage_size' | 'available_size'>,
  ) {
    return await this.model.updateOne(
      { _id },
      { ...params, sync_time: new Date() },
      { new: true },
    );
  }

  async delete_account(_id: string) {
    return await this.model.findOneAndDelete({ _id });
  }

  async get_unsynced_accounts() {
    return this.model.find({
      sync_time: { $lte: new Date(Date.now() - 60000 * 60 * 24) },
    });
  }

  async get_accounts(params = { limit: 20, skip: 0 }) {
    let { limit, skip } = params || { limit: 20, skip: 0 };

    if (!limit) {
      limit = 20;
    }

    if (!skip) {
      skip = 0;
    }

    return await this.model.find().skip(skip).limit(limit);
  }

  async get_account_by_id(_id: string) {
    return this.model.findOne({ _id });
  }

  async get_by_available_size_and_decrease(size: number) {
    return this.model
      .findOneAndUpdate(
        { available_size: { $gt: size } },
        { $inc: { available_size: 0 - size } },
      )
      .sort({ available_size: -1 });
  }

  async increase_available_size(_id: string, size: number) {
    return this.model.updateOne({ _id }, { $inc: { available_size: size } });
  }

  async set_access_token(
    _id: string,
    access_token: string,
    access_token_expiry_time: number,
  ) {
    return this.model.updateOne(
      { _id },
      { $set: { access_token, access_token_expiry_time } },
    );
  }

  async delete_file_by_id(_id: string) {
    return this.model.findOneAndDelete({ _id });
  }

  async get_total_storage(): Promise<TotalStorageResponse> {
    const [result] = await this.model.aggregate([
      {
        $group: {
          _id: 0,
          total_storage: { $sum: '$storage_size' },
          available_storage: { $sum: '$available_size' },
          total_accounts: { $sum: 1 },
        },
      },
    ]);

    return result;
  }

  async update_label(_id: string, label: string): Promise<boolean> {
    const result = await this.model.updateOne({ _id }, { label });
    return !!result.modifiedCount;
  }
}
