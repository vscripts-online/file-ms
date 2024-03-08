import { GrpcOptions, Transport } from '@nestjs/microservices';
import * as path from 'node:path';
import { PORT } from './common';

const services = ['account', 'file'];

export const grpc_options: GrpcOptions = {
  transport: Transport.GRPC,
  options: {
    package: services,
    protoPath: services.map((service) =>
      path.join(__dirname, `../proto/${service}.proto`),
    ),
    url: '0.0.0.0:' + PORT,
    loader: {
      keepCase: true,
      enums: String,
      longs: String,
    },
  },
};
