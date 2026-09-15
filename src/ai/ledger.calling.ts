import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();


export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-now",
  baseURL: process.env.OPENAI_BASE_URL || undefined,
});


export const ledgerTools: OpenAI.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_wallet_balance",
      description: "Fetches user's current wallet balance and locked amount.",
      parameters: {
        type: "object",
        properties: {
          userId: {
            type: "string",
            description: "User UUID whose wallet balance is requested",
          },
        },
        required: ["userId"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "transfer_funds",
      description: "Transfers funds from sender's wallet to receiver's wallet with ledger entry.",
      parameters: {
        type: "object",
        properties: {
          senderUserId: {
            type: "string",
            description: "Sender's User UUID",
          },
          receiverUserId: {
            type: "string",
            description: "Receiver's User UUID",
          },
          amount: {
            type: "number",
            description: "Positive numerical amount to transfer",
          },
        },
        required: ["senderUserId", "receiverUserId", "amount"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_transaction_history",
      description: "Fetches the recent ledger transaction history / statement for a specific user.",
      parameters: {
        type: "object",
        properties: {
          userId: {
            type: "string",
            description: "User UUID whose transaction history is requested",
          },
          limit: {
            type: "number",
            description: "Number of past transactions to fetch (e.g. 5, 10)",
          },
        },
        required: ["userId"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_user",
      description: "Searches for a user by name or email to retrieve their User ID UUID.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Name or email of the user to search (e.g. 'Alice', 'Bob', 'alice@example.com')",
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "place_trading_order",
      description: "Places a trade order (BUY/SELL) on the high-speed exchange orderbook via Kafka matching pipeline.",
      parameters: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "Trading pair, e.g. 'BTC/INR', 'ETH/INR'",
          },
          side: {
            type: "string",
            enum: ["BUY", "SELL"],
            description: "Order side (BUY or SELL)",
          },
          price: {
            type: "number",
            description: "Price per unit in INR",
          },
          quantity: {
            type: "number",
            description: "Quantity of the asset to trade",
          },
        },
        required: ["symbol", "side", "price", "quantity"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_market_ticker",
      description: "Fetches live real-time global market price in INR and USD for any cryptocurrency symbol (e.g. BTC, ETH, SOL, DOGE, XRP, ADA).",
      parameters: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "Crypto asset symbol, e.g. 'BTC', 'ETH', 'SOL', 'DOGE', 'BTC/INR'",
          },
        },
        required: ["symbol"],
        additionalProperties: false,
      },
    },
  },


];
