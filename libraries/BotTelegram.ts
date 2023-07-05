import Telebot from "telebot";
import { Config } from '../common';
const TELEGRAM_BOT_TOKEN = Config.TELEGRAM_INFO.apiKey;
const bot = new Telebot(TELEGRAM_BOT_TOKEN);

export class BotTelegram {
  static async sendMessageError(message: string) {
    const chat_id = Config.TELEGRAM_INFO.groupError;
    return await bot.sendMessage(chat_id, Config.NODEID + "-" + message);
  }

  static async sendMessageDeposit(message: string) {
    const chat_id = Config.TELEGRAM_INFO.groupDeposit;
    return await bot.sendMessage(chat_id, message);
  }

  static async sendMessageWithdraw(message: string) {
    const chat_id = Config.TELEGRAM_INFO.groupWithdraw;
    return await bot.sendMessage(chat_id, message);
  }

  static async sendMessageNewUser(message: string) {
    const chat_id = Config.TELEGRAM_INFO.groupNewUser;
    return await bot.sendMessage(chat_id, message);
  }

  static async sendMessageKYC(message: string, path: string) {
    const chat_id = Config.TELEGRAM_INFO.groupKYC;
    await bot.sendPhoto(chat_id, path);
    return await bot.sendMessage(chat_id, message);
  }


}

