import { getEnvOrThrow } from '../util';

export const PORT = getEnvOrThrow('PORT');
export const MONGO_URI = getEnvOrThrow('MONGO_URI');
