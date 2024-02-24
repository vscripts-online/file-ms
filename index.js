const dotenv = require('dotenv')
dotenv.config()

const mongoose = require('mongoose')

const grpc = require('@grpc/grpc-js')
const protoLoader = require('@grpc/proto-loader');
const { services } = require('./service')

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { dbName: 'vscr-cdn-file-ms' })
  console.log('connected to mongo')

  const packageDef = protoLoader.loadSync('./proto/file.proto', {
    keepCase: true
  });

  const proto = grpc.loadPackageDefinition(packageDef)

  const server = new grpc.Server();
  server.addService(proto.file.FileService.service, services);

  server.bindAsync(
    '0.0.0.0:' + process.env.PORT,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        process.exit(1);
      }

      console.log('listening on port:', port);
    },
  );
}
main()