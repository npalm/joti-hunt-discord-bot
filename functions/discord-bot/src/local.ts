import { logger } from '@joti-hunt/aws-powertools-util';

import { publish } from './bot';

export function run(): void {
  publish()
    .then()
    .catch((e) => {
      logger.error(e);
    });
}

run();
