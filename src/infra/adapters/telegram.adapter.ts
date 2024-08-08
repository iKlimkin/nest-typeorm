import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axiosInstance, { AxiosInstance } from 'axios';
import { ConfigurationType } from '../../settings/config/configuration';

@Injectable()
export class TelegramAdapter {
  private readonly token: string;
  private readonly axiosInstance: AxiosInstance;
  constructor(
    private readonly configService: ConfigService<ConfigurationType>,
  ) {
    this.token = configService.get('telegram').token;
    this.axiosInstance = axiosInstance.create({
      baseURL: `https://api.telegram.org/bot${this.token}/`,
    });
  }

  setHookToTelegram = async (url: string) => {
    try {
      await this.axiosInstance.post('setWebhook', { url });
    } catch (error) {
      console.error('Error setting webhook:', error);
      throw error;
    }
  };

  sendMessage = async (recipientId: number, text: string, config = {}) => {
    await this.axiosInstance.post('sendMessage', {
      chat_id: recipientId,
      text,
      ...config,
    });
  };

  sendAvailableButtons = async (chatId: number) => {
    try {
      console.log('Sending buttons to chat:', chatId);
      const response = await this.axiosInstance.post('sendMessage', {
        chat_id: chatId,
        text: '*Choose an option:*',
        parse_mode: 'MarkdownV2',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🔥 Option 1', callback_data: 'option_1' },
              { text: '🚀 Start', callback_data: 'start' },
            ],
            [
              { text: '❓ Help', callback_data: 'help' },
              { text: '📞 Contact Us', callback_data: 'contact_us' },
            ],
            [
              {
                text: 'Login via Telegram',
                callback_data: 'txt',
              },
              {
                text: 'Search Inline',
                callback_data: 'si',
                switch_inline_query: 'search_query',
              },
            ],
            [
              {
                text: 'Search in this chat',
                callback_data: 'search_in_chat',
                switch_inline_query_current_chat: 'current_chat_query',
              },
              { text: 'Play Game', callback_data: 'game', callback_game: {} },
            ],
            [{ text: 'Pay', callback_data: 'pay', pay: true }],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
          //   force_reply: true,
          remove_keyboard: true,
        },
      });
      console.log('Response from Telegram:', response.data);
    } catch (error) {
      console.error(
        'Error sending buttons:',
        error.response?.data || error.message,
      );
    }
  };
  sendCallBackQuery = async (cbQueryId: number, text: string) => {
    await this.axiosInstance.post(`answerCallbackQuery`, {
      callback_query_id: cbQueryId,
      text,
    });
  };
}

type TgParamsType = {
  url?: string;
  text?: string;
  chat_id?: number;
};
