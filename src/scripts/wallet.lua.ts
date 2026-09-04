import { redis } from "../config/redis.js";

// Lua Script for Atomic Wallet Balance Reservation
const reserveBalanceLua = `
  local walletKey = KEYS[1]
  local amount = tonumber(ARGV[1])

  local balance = tonumber(redis.call('HGET', walletKey, 'balance') or '0')
  local locked = tonumber(redis.call('HGET', walletKey, 'locked') or '0')

  if balance < amount then
      return 0
  end

  redis.call('HSET', walletKey, 'balance', balance - amount)
  redis.call('HSET', walletKey, 'locked', locked + amount)

  return 1
`;

export const reserveBalanceAtomic = async (userId: string, amount: number): Promise<boolean> => {
    const walletKey = `wallet:${userId}`;
    const result = await redis.eval(reserveBalanceLua, 1, walletKey, amount.toString());
    return result === 1;
};
