export type TelegramCTX = {
  message: {
    from: {
      id: number;
      first_name: string;
      username: string;
    };
    text: string;
  };
  callback_query?: CallbackQuery;
};

export type CallbackQuery = {
  id: string;
  from: User;
  message?: Message;
  inline_message_id?: string;
  chat_instance: string;
  data?: string;
  game_short_name?: string;
};

export type User = {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

export type Message = {
  message_id: number;
  from?: User;
  chat: Chat;
  date: number;
  text?: string;
};

export type Chat = {
  id: number;
  type: string;
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
};
