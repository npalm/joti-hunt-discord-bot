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
  type: 'news' | 'hint' | 'assignment' | undefined;
}

const logger = createChildLogger('bot');

export async function publish(): Promise<void> {
  const articles = await getArticles();
  logger.info(`Got ${articles.length} articles`);

  const ssmClient = new SSMClient({});
  const latest = await ssmClient
    .send(
      new GetParameterCommand({
        Name: latestProcessedArticleId,
      }),
    )
    .then((result) => parseInt(result.Parameter?.Value ?? '-1'))
    .catch((error) => {
      logger.error(error);
      return -1;
    });
  // const latest = parseInt(latestProcessedArticleIdParam.Parameter?.Value ?? '-0');
  console.log(`Latest processed article id: ${latest}`);

  for (const article of articles) {
    if (article.id > latest) {
      logger.info(`New article id: ${article.id}`);
      await publishToDiscord(article);
    } else {
      logger.info(`Skipping article ${article.id} because it was already processed`);
    }
  }

  // update latest processed article id
  ssmClient.send(
    new PutParameterCommand({
      Name: latestProcessedArticleId,
      Value: `${articles[articles.length - 1].id}`,
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
      prependMessage = '## :bulb: Nieuwe hint!!!';
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
  // we assume no more then 15 articles are published at once
  const response = (await axios.get(articleEndpoint, {})).data;
  if (!Array.isArray(response.data)) {
    logger.error('API response data is not an array:', response.data);
    return [];
  }

  const articles = response.data as Article[];
  articles.sort((a, b) => a.id - b.id);

  // sort based on publish date oldest first
  articles.sort((a, b) => new Date(a.publish_at).getTime() - new Date(b.publish_at).getTime());

  return articles;
}
