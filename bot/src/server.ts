import Fastify from 'fastify';
import cors from '@fastify/cors'
import { verificationSuccessQueue } from './queues';
import UserModel from './models/user';
import ChatModel from './models/chat';
import validateDataFromMiniApp from './utils/validateInitData';

const fastify = Fastify({
  logger: true
})

fastify.register(cors, {
  origin: '*'
})

fastify.post<{Params: { userObjId: string}, Body:{ initData: string }}>('/api/verifications/:userObjId/getChat', async (request, reply) => {
  console.log('1');
  const validationResult = validateDataFromMiniApp(request.body.initData);
  console.log('postvalidate');
  if (!validationResult.isValid){
    return reply.send({success: false, error: 'MAILFORMED_HASH'});
  }

  const userObj = await UserModel.findById(request.params.userObjId);
  if (!userObj) {
    return reply.send({ success: false, error: 'USERNOTFOUND' });
  }
  if (validationResult.data.user.id !== userObj.userId){
    return reply.send({ success: false, error: 'INVALID_USER' });
  }

  const chatObj = await ChatModel.findOne({chatId: userObj.chatId});

  reply.send({
    success: true,
    data: chatObj
  });
})



fastify.post<{ Params: { userObjId: string }, Body: { recaptchaToken: string, initData: string } }>('/api/verifications/:userObjId/challenge', async (request, reply) => {
  const validationResult = validateDataFromMiniApp(request.body.initData);
  if (!validationResult.isValid){
    return reply.send({success: false, error: 'MAILFORMED_HASH'});
  }


  const userObj = await UserModel.findById(request.params.userObjId);
  if (!userObj) {
    return reply.send({ success: false, error: 'USERNOTFOUND' });
  }

  if (validationResult.data.user.id !== userObj.userId){
    return reply.send({ success: false, error: 'INVALID_USER' });
  }

  const { recaptchaToken } = request.body;
  
  const verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${recaptchaToken}`;
  
  const recaptchaResponse = await fetch(verificationURL, {
    method: 'POST',
  });
  const recaptchaData: any = await recaptchaResponse.json();

  console.log('recaptchaData', recaptchaData)

  if (!recaptchaData.success) {
    return reply.send({ success: false, error: 'RECAPTCHA_VALIDATION_FAILED' });
  }


  
  if (!userObj.verified){
    userObj.verified = true;
    await userObj.save();

    verificationSuccessQueue.add('verificationSuccess', { userObj });
  }

  reply.send({
    success: true,
    data: userObj
  });

  console.log(`Success verification for user ${userObj.userId}`);
});


function start() {
  // Run the server!
  fastify.setErrorHandler((error) => {
    console.log('Received error', error);
  })

  fastify.listen({ port: 12000, host: '0.0.0.0' }, (err, address) => {
    if (err) throw err
    // Server is now listening on ${address}
  })
}




export default start;