import { stopServer } from '../src/server';

module.exports = async () => {
  await stopServer(
    global.__SERVER__,
    global.__PRISMA__,
    global.__CRONJOB__,
    global.__TOKEN_CLEANUP_WORKER__,
    global.__INGESTION_WORKER__,
    global.__FILE_CLEANUP_CRON__,
    global.__FILE_CLEANUP_WORKER__,
  );
};
