import { prop, getModelForClass } from '@typegoose/typegoose';
import { User as GrammyUser } from 'grammy/types';
import { SchemaTypes } from 'mongoose';

export class User {
  @prop({ required: true, type: Number })
  userId!: number;

  @prop({ required: true, type: SchemaTypes.BigInt })
  chatId!: number;

  @prop({type: Date})
  joinedAt?: Date;

  @prop({type: Number})
  welcomeMessageId?: number;

  @prop({type: Boolean})
  verified?: boolean;

  // @prop({type: Object})
  userTgObj?: GrammyUser;
}

const UserModel = getModelForClass(User, {schemaOptions: { timestamps: true }});

export default UserModel;
