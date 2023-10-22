import { GetParameterCommand, PutParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import { createChildLogger } from '@joti-hunt/aws-powertools-util';
import axios from 'axios';
import TurndownService from 'turndown';

const turndownService = new TurndownService();
const latestProcessedArticleId = process.env.SSM_ARTICLE_ID ?? '/jotihunt/discord-bot/latest-article-id';
const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL ?? '';
const articleEndpoint = process.env.ARTICLE_ENDPOINT ?? 'https://jotihunt.nl/api/2.0/articles';

interface Article {
  id: number;
  title: string;
  message: {
    content: string;
  };
  publish_at: string;
  end_time?: string;
  max_points?: number;
  type: 'news' | 'hint' | 'assignment' | undefined;
}

const logger = createChildLogger('bot');

export async function publish(): Promise<void> {
  const articles = await getArticles();
  logger.info(`Got ${articles.length} articles`);

  const ssmClient = new SSMClient({});
  let latestIsoString = await ssmClient
    .send(
      new GetParameterCommand({
        Name: latestProcessedArticleId,
      }),
    )
    .then((result) => result.Parameter?.Value ?? '1970-01-01T00:00:00.000Z')
    .catch(() => {
      return '1970-01-01T00:00:00.000Z';
    });
  // convert latestIsoString to date
  const latest = new Date(latestIsoString);

  //let newLatest = latestIsoString;
  for (const article of articles) {
    const publishDate = new Date(article.publish_at);
    if (!latestIsoString.includes(article.publish_at + '_' + article.id)) {
      logger.info(`New article id: ${article.id}`);
      try {
        await publishToDiscord(article);
        latestIsoString = article.publish_at + '_' + article.id + ':' + latestIsoString;
        latestIsoString = latestIsoString.slice(0, 500);
      } catch (error) {
        logger.error(`Error publishing article ${article.id} to discord: ${error}`);
      }
    } else {
      logger.info(`Skipping article ${article.id} because it was already processed`);
    }
  }

  // update latest processed article id
  ssmClient.send(
    new PutParameterCommand({
      Name: latestProcessedArticleId,
      Value: latestIsoString,
      Type: 'String',
      Overwrite: true,
    }),
  );
}

async function publishToDiscord(article: Article): Promise<void> {
  logger.info(`Publishing article ${article.id} to discord`);

  const htmlContent = article.message.content;
  const markdownContent = convertHtmlToMarkdown(htmlContent);

  let prependMessage = '';
  switch (article.type) {
    case 'hint':
      prependMessage = '# :bulb: Nieuwe hint!!!';
      // add on a new line max point end end time
      if (article.max_points) {
        prependMessage += `\n:moneybag: Max punten: ${article.max_points}`;
      }
      if (article.end_time) {
        prependMessage += ` \n:stopwatch: Eind tijd: ${getDateTime(article.end_time)}`;
      }

      break;
    case 'assignment':
      prependMessage = '# :pencil: Nieuwe opdracht!!!';
      break;
    case 'news':
      prependMessage = '# :newspaper: Nieuwsbericht!!!';
      break;
    default:
      prependMessage = '# :speech_balloon: Nieuw bericht!!!';
      break;
  }

  const publishDate = new Date(article.publish_at);
  const humanReadableDate = publishDate.toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  // convert time to timezone +2
  publishDate.setHours(publishDate.getHours() + 2);
  const humanReadableTime = publishDate.toLocaleTimeString('nl-NL', {
    hour: 'numeric',
    minute: 'numeric',
  });

  // eslint-disable-next-line max-len
  const content = `${prependMessage}\n## [${article.title}](https://jotihunt.nl/)\n*${humanReadableTime} - ${humanReadableDate}*\n\n${markdownContent}`;
  const response = await axios.post(discordWebhookUrl, {
    content: content,
  });
  logger.info(`Discord response: ${response.status} - ${response.statusText}`); // 200 - OK
}

function convertHtmlToMarkdown(html: string): string {
  turndownService.addRule('figure', {
    filter: 'figure',
    replacement: (content, node) => {
      const img = node.querySelector('img');
      const caption = node.querySelector('figcaption');
      if (img) {
        return `![${caption ? caption.textContent : ''}](${img.src})`;
      }
      return '';
    },
  });

  const markdown = turndownService.turndown(html);
  return markdown;
}

async function getArticles(): Promise<Article[]> {
  const response = (await axios.get(articleEndpoint)).data;
  const articles = response.data as Article[];

  // revert order
  articles.reverse();

  return articles;
}

function getDateTime(isoDateStringinUTC: string): string {
  const date = new Date(isoDateStringinUTC);
  const humanReadableDate = date.toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  // convert time to timezone +2
  date.setHours(date.getHours() + 2);
  const humanReadableTime = date.toLocaleTimeString('nl-NL', {
    hour: 'numeric',
    minute: 'numeric',
  });

  return `${humanReadableTime} - ${humanReadableDate}`;
}
