import { Redis } from "ioredis";

const getRedisUrl = () => {
  if (process.env.REDIS_URL) {
    console.log("REDIS_URL is defined.");
    return process.env.REDIS_URL;
  }
  throw new Error("REDIS_URL is not defined.");
};

const redisClient = new Redis(getRedisUrl());

export default redisClient;
