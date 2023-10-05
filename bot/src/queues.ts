import { Queue } from 'bullmq';
import redisConfig from './redisConfig';

export const verificationSuccessQueue = new Queue('verificationSuccessQueue', {connection: redisConfig});

export const verificationTimeoutQueue = new Queue('verificationTimeoutQueue', {connection: redisConfig});