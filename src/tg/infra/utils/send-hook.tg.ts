import axios from 'axios';

export const createTelegramSender =
  (token: string) =>
  async (
    params: TgParamsType,
    method: 'setWebhook' | 'sendMessage' = 'setWebhook',
  ) => {
    const url = `https://api.telegram.org/bot${token}/${method}`;
    if (method === 'setWebhook') {
      await axios.post(url, { url: params.url });
    } else {
      await axios.post(url, params);
    }
  };

type TgParamsType = {
  url?: string;
  text?: string;
  recipientId?: number;
  chat_id?: number;
};
