import UserModel from "../models/user";

export default async function isUserVerified(userId: number, chatId: string | number): Promise<boolean> {
  const userRecord = await UserModel.findOne({
    userId: userId,
    chatId: chatId
  });
  return !!userRecord?.verified;
}
