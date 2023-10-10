export default {
  host: process.env.REDIS_HOST,
  port: parseInt(String(process.env.REDIS_PORT)),
  username:process.env.REDIS_USERNAME,
  password:process.env.REDIS_PASSWORD,
  db: Number(process.env.REDIS_DB || 0)
}