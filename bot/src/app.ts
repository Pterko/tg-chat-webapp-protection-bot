import * as dotenv from 'dotenv';
dotenv.config();

import { Bot, InlineKeyboard } from "grammy";

// Create an instance of the `Bot` class and pass your bot token to it.
const bot = new Bot(String(process.env.BOT_TOKEN)); // <-- put your bot token between the ""

// You can now register listeners on your bot object `bot`.
// grammY will call the listeners when users send messages to your bot.

// Handle the /start command.
bot.command("start", (ctx) => ctx.reply("Welcome! Up and running."));
// Handle other messages.
bot.on("message", (ctx) => {
  const inlineKeyboard = new InlineKeyboard().webApp("Open Shop", String(process.env.WEB_APP_URL))

  ctx.reply("Got another message!", {
    reply_markup: inlineKeyboard
  })

});

// Now that you specified how to handle messages, you can start your bot.
// This will connect to the Telegram servers and wait for messages.

// Start the bot.
bot.start();