export const getEnvOrThrow = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw Error(`${key} not found in .env`);
  }

  return value;
};
