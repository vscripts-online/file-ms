import { Global, Module } from '@nestjs/common';
import { AccountController } from './account.controller';

@Global()
@Module({
  controllers: [AccountController],
  providers: [AccountController],
  exports: [AccountController],
})
export class AccountModule {}
