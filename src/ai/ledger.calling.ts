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
          reciverUserId: {
            type: "string",
            description: "Receiver's User UUID",
          },
          amount: {
            type: "number",
            description: "Positive numerical amount to transfer",
          },
        },
        required: ["senderUserId", "reciverUserId", "amount"],
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
];
