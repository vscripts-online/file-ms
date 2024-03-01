import { config } from 'dotenv';
config();

import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { ExceptionFilter } from './filter';
import { grpc_options } from './grpc-options';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    grpc_options,
  );

  app.useGlobalFilters(new ExceptionFilter());

  await app.listen();
  console.log(app['server'].url);

  // const app = await NestFactory.create(AppModule);
  // app.connectMicroservice<MicroserviceOptions>(grpc_options);

  // await app.startAllMicroservices();
  // await app.listen(3000);
  // console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
