import { config } from 'dotenv';
config();

import * as path from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { PORT } from './common';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'file',
        protoPath: path.join(__dirname, '../proto/file.proto'),
        url: '0.0.0.0:' + PORT,
        loader: {
          keepCase: true,
        },
      },
    },
  );

  await app.listen();
  console.log(app['server'].url);
}
bootstrap();
