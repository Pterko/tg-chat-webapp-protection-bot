import { prop, getModelForClass } from '@typegoose/typegoose';
import mongoose, { SchemaTypes } from 'mongoose';

export class Chat {
  @prop({ required: true, type: SchemaTypes.BigInt })
  chatId!: number;

  @prop({type: String})
  chatTitle?: string;

  @prop({type: Boolean})
  protectionEnabled?: boolean;

  @prop({type: () => [String], default: []})
  rules?: string[]
}

const ChatModel = getModelForClass(Chat, {schemaOptions: { timestamps: true }});

export default ChatModel;
