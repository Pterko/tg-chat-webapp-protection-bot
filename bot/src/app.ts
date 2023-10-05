import * as dotenv from 'dotenv';
dotenv.config();

import { Bot, InlineKeyboard, Context, CommandContext, Api } from "grammy";
import mongoose, { Document } from 'mongoose';
import { DocumentType } from '@typegoose/typegoose';


import connectDb from './database';
import Chat from './models/chat';
import UserModel, { User } from './models/user';

connectDb();

import { Worker } from 'bullmq';

import webServer from "./server";
import user from './models/user';
import redisConfig from './redisConfig';
import { verificationTimeoutQueue } from './queues';
webServer();


const bot = new Bot(String(process.env.BOT_TOKEN));

bot.use((ctx, next) => {
  console.log('Bot received event'),
    console.log(ctx.update.message);
  next();
})

bot.command("start", (ctx) => ctx.reply("Welcome! Up and running."));

bot.on(":new_chat_members", async (ctx) => {
  console.log('new_chat_members', ctx.update.message?.new_chat_members)
  // Check if the bot was added to the chat\
  if (!ctx.update.message?.new_chat_members) {
    return;
  }

  for (let user of ctx.update.message?.new_chat_members) {
    if (user.id === bot.botInfo.id) {
      const chat = new Chat({
        chatId: ctx.chat.id,
        protectionEnabled: false
      });

      await chat.save();
    } else {
      const chatRecord = await Chat.findOne({ chatId: ctx.chat.id });

      if (chatRecord && chatRecord.protectionEnabled) {


        const existingUserInThisChat = await UserModel.findOne({
          userId: user.id,
          chatId: ctx.chat.id
        })

        let desiredUser: typeof existingUserInThisChat;

        // Skip already verified users
        if (existingUserInThisChat?.verified) {
          console.log('Skip existing verified user');
          return;
        }

        if (!existingUserInThisChat) {
          const newUser = new UserModel({
            userId: user.id,
            chatId: ctx.chat.id,
            joinedAt: new Date(),
            userTgObj: user
            // challengeId: "123" // You need to create this function
          });
          await newUser.save();
          console.log('created user');
          desiredUser = newUser;
        } else {
          desiredUser = existingUserInThisChat;
        }

        // Send the user a message with the verification link
        const askToVerifyMessage = await ctx.reply(
          `Welcome, [${user.first_name}](tg://user?id=${user.id})\\! [Please complete the verification here](${process.env.WEB_APP_TG_URI}?startapp=${desiredUser._id})`,
          {parse_mode: 'MarkdownV2'}
          );

        desiredUser.welcomeMessageId = askToVerifyMessage.message_id;
        await desiredUser.save();


        verificationTimeoutQueue.add('verificationTimeoutQueue', {
          userId: desiredUser._id
        }, { delay: 120 * 1000 })
        console.log('Delayed message sent');
      }
    }
  }

});


const verificatiomTimeoutWorker = new Worker('verificationTimeoutQueue', async job => {
  console.log('verificationTimeoutQueue', job.data);
  const userRecord = await UserModel.findById(job.data.userId);

  if (userRecord && !userRecord.verified) {
    // Code to remove the user from chat
    // ctx.banChatMember(ctx.from.id, )
    const removeMessageResult = await bot.api.sendMessage(userRecord.chatId, `Sorry, [${userRecord.userTgObj?.first_name}](tg://user?id=${userRecord.userTgObj?.id}), you didn\'t met the deadline of verification. You can try to join this chat again when you\'ll be ready`, {parse_mode: 'MarkdownV2'});
    const removeResult = await bot.api.banChatMember(userRecord.chatId, userRecord.userId);
    console.log('RemoveResult', removeResult);
    await bot.api.deleteMessage(userRecord.chatId, removeMessageResult.message_id);
  }
  if (userRecord?.welcomeMessageId) {
    await bot.api.deleteMessage(String(userRecord?.chatId), userRecord?.welcomeMessageId);
  }
  return true;
}, { connection: redisConfig });

const verificationSuccessWorker = new Worker('verificationSuccessQueue', async job => {
  // Will print { foo: 'bar'} for the first job
  // and { qux: 'baz' } for the second.
  console.log('worker received data', job.data);
  const userObj: User = job.data.userObj;
  console.log(`Successful verification for user ${userObj.userId}`);
  return true;
}, { connection: redisConfig });

bot.on("message:new_chat_members", async (ctx) => {
  for (const member of ctx.message.new_chat_members) {
    if (member.id === bot.botInfo.id) {
      // This means our bot was added to the chat

      // Check if chat is already registered in the database
      const existingChat = await Chat.findOne({ chatId: ctx.chat.id });
      if (!existingChat) {
        const chat = new Chat({
          chatId: ctx.chat.id,
          protectionEnabled: false
        });
        await chat.save();
        ctx.reply("Thank you for adding me to this chat! Use /enableProtection to activate user sandboxing.");
      } else {
        ctx.reply("I'm back! Use /enableProtection to activate user sandboxing.");
      }
    }
  }
});




async function isAdmin(ctx: Context) {
  const chatAdmins = await ctx.api.getChatAdministrators(Number(ctx.chat?.id));
  for (let admin of chatAdmins) {
    if (admin.user.id === ctx.from?.id) {
      return true;
    }
  }
  return false;
}

bot.command('enableProtection', async (ctx) => {
  if (ctx.chat.type == "group" || ctx.chat.type == "supergroup") {
    if (await isAdmin(ctx)) {
      await Chat.updateOne({ chatId: ctx.chat.id }, { protectionEnabled: true, chatTitle: ctx.chat.title }, { upsert: true });
      ctx.reply("Protection enabled!");
    } else {
      ctx.reply("Only admins can enable protection.");
    }
  }
});

bot.command('setRules', async (ctx) => {
  if (ctx.chat.type == "group" || ctx.chat.type == "supergroup") {
    if (await isAdmin(ctx)) {
      let rules = [];
      if (ctx.match.indexOf('\n') > 0){
        const strings = ctx.match.split('\n');
        rules.push(...strings.map(x => x.trim()).filter(x => x));
      } else {
        rules.push(ctx.match.trim());
      }
    
      await Chat.updateOne({ chatId: ctx.chat.id }, { rules }, { upsert: true });
      ctx.reply(`Chat rules updated. Current Rules: \n\n${rules.join('\n')}`);
    } else {
      ctx.reply("Only admins can change rules.");
    }
  }
})

bot.command('disableProtection', async (ctx) => {
  if (ctx.chat.type == "group" || ctx.chat.type == "supergroup") {
    if (await isAdmin(ctx)) {
      await Chat.updateOne({ chatId: ctx.chat.id }, { protectionEnabled: false }, { upsert: true });
      ctx.reply("Protection disabled!");
    } else {
      ctx.reply("Only admins can disable protection.");
    }
  }
});

bot.start({
  allowed_updates: [
    //'callback_query',
    //'chosen_inline_result',
    //'edited_message',
    //'inline_query',
    'message',
    //'poll',
    //'poll_answer',
    'chat_member',
  ]
});
