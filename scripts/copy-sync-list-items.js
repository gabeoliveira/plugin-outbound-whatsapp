import * as dotenv from 'dotenv';
import Twilio from 'twilio';

dotenv.config();

const run = async () => {
  const sourceClient = new Twilio(
    process.env.SOURCE_ACCOUNT_SID,
    process.env.SOURCE_AUTH_TOKEN
  );

  const destinationClient = new Twilio(
    process.env.DESTINATION_ACCOUNT_SID,
    process.env.DESTINATION_AUTH_TOKEN
  );

  const items = await sourceClient.sync.v1
    .services(process.env.SOURCE_SYNC_SERVICE_SID)
    .syncLists(process.env.SOURCE_SYNC_LIST_SID)
    .syncListItems.list();

  for (const item of items) {
    console.log(`copying list-item with data: ${JSON.stringify(item.data)}`);

    await destinationClient.sync.v1
      .services(process.env.DESTINATION_SYNC_SERVICE_SID)
      .syncLists(process.env.DESTINATION_SYNC_LIST_SID)
      .syncListItems.create({
        data: item.data,
      });
  }
};

await run();
