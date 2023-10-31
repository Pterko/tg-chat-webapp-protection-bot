import * as dotenv from 'dotenv';
dotenv.config();

import { Bot, Context } from "grammy";
import { User as GrammyUser } from 'grammy/types';
import mongoose from 'mongoose';

import connectDb from './database';
import Chat from './models/chat';
import UserModel, { User } from './models/user';
import { verificationTimeoutQueue } from './queues';
import webServer from "./server";
import redisConfig from './redisConfig';
import { Worker } from 'bullmq';
import isUserVerified from './utils/isUserVerified';

Object.defineProperty(BigInt.prototype, "toJSON", {
  get() {
      "use strict";
      return () => String(this);
  }
});

connectDb();
webServer();

const bot = new Bot(String(process.env.BOT_TOKEN));

bot.use((ctx, next) => {
  console.log('Bot received event', ctx.update);
  next();
});

bot.command("start", (ctx) => ctx.reply("Welcome! Up and running."));

bot.on("message:text", async (ctx, next) => {
  if (ctx.chat && ["group", "supergroup"].includes(ctx.chat.type)) {
    const userId = ctx.from?.id;
    const chatId = ctx.chat.id;

    if (userId) {
      const verified = await isUserVerified(userId, chatId);
      const admin = await isAdmin(ctx);
      if (!verified && !admin) {
        // If the user is neither verified nor an admin, delete their message
        if (ctx.message?.message_id) {
          await bot.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
        }
        return; // Stop further processing
      }
    }
  }
  next();
});


const processNewMembers = async (ctx: Context) => { 
  const newMembers = ctx.update.message?.new_chat_members || [];

  for (let user of newMembers) {
    if (user.id === bot.botInfo.id) {
      await handleBotAddedToChat(ctx);
    } else {
      await handleNewUser(ctx, user);
    }
  }
}

const handleBotAddedToChat = async (ctx: Context) => {
  const existingChat = await Chat.findOne({ chatId: ctx.chat?.id });
  if (!existingChat) {
    const chat = new Chat({
      chatId: ctx.chat?.id,
      protectionEnabled: false
    });
    await chat.save();
    ctx.reply("Thank you for adding me to this chat! Use /enableProtection to activate user sandboxing.");
  } else {
    ctx.reply("I'm back! Use /enableProtection to activate user sandboxing.");
  }
}

const handleNewUser = async (ctx: Context, user: GrammyUser) => {
  const chatRecord = await Chat.findOne({ chatId: ctx.chat?.id });

  if (chatRecord && chatRecord.protectionEnabled) {
    let desiredUser = await UserModel.findOne({
      userId: user.id,
      chatId: ctx.chat?.id
    });

    if (desiredUser?.verified) {
      console.log('Skip existing verified user');
      return;
    }

    if (!desiredUser) {
      desiredUser = new UserModel({
        userId: user.id,
        chatId: ctx.chat?.id,
        joinedAt: new Date(),
        userTgObj: user
      });
      await desiredUser.save();
    }

    const askToVerifyMessage = await ctx.reply(
      `Welcome, [${user.first_name}](tg://user?id=${user.id})\\! [Please complete the verification here](${process.env.WEB_APP_TG_URI}?startapp=${desiredUser._id})`,
      { parse_mode: 'MarkdownV2' }
    );

    desiredUser.welcomeMessageId = askToVerifyMessage.message_id;
    await desiredUser.save();

    verificationTimeoutQueue.add('verificationTimeoutQueue', {
      userId: desiredUser._id
    }, { delay: 120 * 1000 });
  }
}

bot.on("chat_member", async (ctx) => {
  const chatMemberUpdate = ctx.update.chat_member;
  if (chatMemberUpdate) {
    const newUser = chatMemberUpdate.new_chat_member;
    const oldUser = chatMemberUpdate.old_chat_member;

    // Check if the user is actually joining the chat
    if (newUser.status === 'member' && oldUser.status !== 'member') {
      await handleNewUser(ctx, newUser.user);
    }
  }
});

// bot.on(":new_chat_members", processNewMembers);
// bot.on("message:new_chat_members", processNewMembers);

async function isAdmin(ctx: Context): Promise<boolean> {
  const chatAdmins = await ctx.api.getChatAdministrators(Number(ctx.chat?.id));
  return chatAdmins.some(admin => admin.user.id === ctx.from?.id);
}

const handleProtectionCommand = async (ctx: Context, enable: boolean) => {
  if (["group", "supergroup"].includes(String(ctx.chat?.type)) && await isAdmin(ctx)) {
    await Chat.updateOne({ chatId: ctx.chat?.id }, { protectionEnabled: enable }, { upsert: true });
    ctx.reply(enable ? "Protection enabled!" : "Protection disabled!");
  } else {
    ctx.reply("Only admins can modify protection.");
  }
}

bot.command('enableProtection', (ctx) => handleProtectionCommand(ctx, true));
bot.command('disableProtection', (ctx) => handleProtectionCommand(ctx, false));

bot.command('setRules', async (ctx) => {
  if (["group", "supergroup"].includes(ctx.chat.type) && await isAdmin(ctx)) {
    const rules = ctx.match.split('\n').map(x => x.trim()).filter(Boolean);
    await Chat.updateOne({ chatId: ctx.chat.id }, { rules }, { upsert: true });
    ctx.reply(`Chat rules updated. Current Rules: \n\n${rules.join('\n')}`);
  } else {
    ctx.reply("Only admins can change rules.");
  }
})


bot.start({
  allowed_updates: ['message', 'chat_member']
});




const verificationSuccessWorker = new Worker('verificationSuccessQueue', async job => {
  // Will print { foo: 'bar'} for the first job
  // and { qux: 'baz' } for the second.
  console.log('worker received data', job.data);
  const userObj: User = job.data.userObj;
  console.log(`Successful verification for user ${userObj.userId}`);
  if (userObj && userObj.welcomeMessageId){
    await bot.api.deleteMessage(String(userObj.chatId), userObj.welcomeMessageId);
  }
  return true;
}, { connection: redisConfig });

const verificatiomTimeoutWorker = new Worker('verificationTimeoutQueue', async job => {
  console.log('verificationTimeoutQueue', job.data);
  const userRecord = await UserModel.findById(job.data.userId);



  if (userRecord && !userRecord.verified) {
    // Code to remove the user from chat
    // ctx.banChatMember(ctx.from.id, )
    const removeMessageResult = await bot.api.sendMessage(String(userRecord.chatId), `Sorry, [${userRecord.userTgObj?.first_name}](tg://user?id=${userRecord.userTgObj?.id}), you didn\'t met the deadline of verification. You can try to join this chat again when you\'ll be ready`, {parse_mode: 'MarkdownV2'});
    const removeResult = await bot.api.banChatMember(String(userRecord.chatId), userRecord.userId);
    console.log('RemoveResult', removeResult);
    await bot.api.deleteMessage(String(userRecord.chatId), removeMessageResult.message_id);
  }
  if (userRecord?.welcomeMessageId) {
    await bot.api.deleteMessage(String(userRecord?.chatId), userRecord?.welcomeMessageId);
  }
  return true;
}, { connection: redisConfig });