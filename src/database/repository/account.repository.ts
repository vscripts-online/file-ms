import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AccountSchema } from '../model';

@Injectable()
export class AccountRepository {
  @InjectModel(AccountSchema.name) private readonly model: Model<AccountSchema>;

  // async new_account(type: AccountTypes, label?: string) {
  //   return await this.model.create({ type, label });
  // }

  // async sync_size(
  //   _id: string,
  //   params: Pick<IAccountSchema, 'storage_size' | 'available_size'>,
  // ): Promise<any> {
  //   return await this.model.findOneAndUpdate({ _id }, params, { new: true });
  // }

  // async delete_account(_id: string) {
  //   return await this.model.findOneAndDelete({ _id });
  // }

  // async get_accounts(params: ISearch = DEFAULT_SEARCH) {
  //   let { limit, skip } = params || DEFAULT_SEARCH;

  //   if (!limit) {
  //     limit = 20;
  //   }

  //   if (!skip) {
  //     skip = 0;
  //   }

  //   return await this.model.find().skip(skip).limit(limit);
  // }

  // async get_account_by_id(_id: string) {
  //   return this.model.findOne({ _id });
  // }

  // async get_by_available_size_and_decrease(size: number) {
  //   return this.model
  //     .findOneAndUpdate(
  //       { available_size: { $gt: size } },
  //       { $inc: { available_size: 0 - size } },
  //     )
  //     .sort({ available_size: -1 });
  // }

  // async increase_available_size(_id: string, size: number) {
  //   return this.model.updateOne(
  //     { _id },
  //     { $inc: { available_size: 0 - size } },
  //   );
  // }

  // async set_access_token(
  //   _id: string,
  //   access_token: string,
  //   access_token_expiry_time: number,
  // ) {
  //   return this.model.updateOne(
  //     { _id },
  //     { $set: { access_token, access_token_expiry_time } },
  //   );
  // }

  // async delete_file_by_id({ _id }) {
  //   return this.model.deleteOne({ _id });
  // }
}
