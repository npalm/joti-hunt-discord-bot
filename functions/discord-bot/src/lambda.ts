import { logger, setContext } from '@joti-hunt/aws-powertools-util';
import { Context } from 'aws-lambda';
import 'source-map-support/register';

import { publish } from './bot';

export async function handler(event: unknown, context: Context): Promise<void> {
  setContext(context, 'lambda.ts');
  logger.logEventIfEnabled(event);

  try {
    await publish();
  } catch (e) {
    logger.error(`${(e as Error).message}`, { error: e as Error });
  }
}
