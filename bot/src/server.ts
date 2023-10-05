import Fastify from 'fastify'
import { verificationSuccessQueue } from './queues';
import UserModel from './models/user';
import ChatModel from './models/chat';

const fastify = Fastify({
  logger: true
})

// Declare a route
fastify.get('/api/', (request, reply) => {
  reply.send({ hello: 'world' })
})

fastify.post<{ Params: {userObjId: string} }>('/api/verifications/:userObjId/verify', async (request, reply) => {
  const userObj = await UserModel.findById(request.params.userObjId);
  if (!userObj){
    return reply.send({success: false, error: 'USERNOTFOUND'});
  }

  userObj.verified = true;
  userObj.save();
  reply.send({
    success: true,
    data: userObj
  })

});

fastify.get<{Params: { userObjId: string }}>('/api/verifications/:userObjId/getChat', async (request, reply) => {
  const userObj = await UserModel.findById(request.params.userObjId);
  if (!userObj) {
    return reply.send({ success: false, error: 'USERNOTFOUND' });
  }

  const chatObj = await ChatModel.findOne({chatId: userObj.chatId});

  reply.send({
    success: true,
    data: chatObj
  });
})



fastify.post<{ Params: { userObjId: string }, Body: { recaptchaToken: string } }>('/api/verifications/:userObjId/challenge', async (request, reply) => {
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

  const userObj = await UserModel.findById(request.params.userObjId);
  if (!userObj) {
    return reply.send({ success: false, error: 'USERNOTFOUND' });
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
  fastify.listen({ port: 12000 }, (err, address) => {
    if (err) throw err
    // Server is now listening on ${address}
  })
}



export default start;