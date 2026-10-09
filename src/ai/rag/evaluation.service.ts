import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { MODEL_CONFIG } from "../utils/model.router.js";
import { GenerateContentResponse } from "@google/genai";

export interface RagDocs {
    id: string,
    title: string,
    content: string,
    category?: string,
    score?: number,
}

export function reorderChunksLostInMiddle(docs: RagDocs[]): RagDocs[] {
    if (docs.length <= 2) return docs;

    const reOrderd: RagDocs[] = new Array(docs.length);
    let left = 0;
    let right = docs.length - 1;

    for (let i = 0; i < docs.length; i++) {
        if (i % 2 === 0) {
            reOrderd[left] = docs[i]
            left++
        } else {
            reOrderd[right] = docs[i]
            right--;

        }
    }
    return reOrderd
}

const evaluatorModel = new ChatOpenAI({
    modelName: MODEL_CONFIG.HEAVY,
    temperature: 0,
})

export interface FaithFullnessEvaluation {
    score: number,
    isFaithfull: boolean;
    reasoning: string,
    hallucinatedClaims: string[];
}



export async function evaluateFaithFullness(contextDocs: RagDocs[], generatedAns: string): Promise<FaithFullnessEvaluation> {
    const contentText = contextDocs.map((d, idx) => `DOCS ${idx + 1} , Title : ${d.title}: \n${d.content}`).join("\n\n");

    const prompt = `You are an impartial AI Compliance and Accuracy Judge for a Finincial System.
    Your task is to evaluate if the GENERATED_ANSWER is strictly grounded in the provided CONTEXT_DOCS.
    
    CONTEXT_DOCS: ${contentText}
    
    GENERATED_DOCS: ${generatedAns}
    Instructions:
1. Break down the GENERATED_ANSWER into individual factual statements/claims.
2. For every claim, verify if it can be directly inferred from the CONTEXT_DOCUMENTS.
3. If the answer introduces facts, fees, numbers, or rules NOT mentioned in the context, flag them as hallucinated.
4. Output STRICT JSON format with this exact structure:
{
  "score": <number between 0.0 and 1.0>,
  "reasoning": "<concise explanation of findings>",
  "hallucinatedClaims": ["<claim 1>", "<claim 2>"]
}
Return ONLY the raw JSON object, without markdown blocks.`;

    const response = await evaluatorModel.invoke([new HumanMessage({ content: prompt })])
    const responseText = (response.content as string).replace(/```json|```/g, "").trim();

    try {
        const prased = JSON.parse(responseText);
        return {
            score: prased.score ?? 0,
            isFaithfull: (prased.score ?? 0) >= 0.8,
            reasoning: prased.reasoning || "Evaluated successfully",
            hallucinatedClaims: prased.hallucinatedClaims || [] // as empty array
        };
    } catch {
        return {
            score: 0,
            isFaithfull: false,
            reasoning: "Failed to parse JSON evaluation response",
            hallucinatedClaims: ["parsing error"]
        }
    }


}


export interface RelevanceEvaluation {
    score: number,
    isRelevant: boolean,
    reasoning: string;
}

export async function evaluateRelevanceAnswer(userQuestion: string, generatedAns: string): Promise<RelevanceEvaluation> {
    const prompt = `You are an evaluation judge for an AI Assistant. 
    Evaluate if the GENERATED_ANSWER directly and completely addresses the USER_QUESTION without evasiveness or irrelevant filter.
    
    USER_QUESTION: ${userQuestion}
    
    GENERATED_ANSWER: ${generatedAns}
    
    Output STRICT JSON format: {
     "score": <number between 0.0 and 1.0>,
     "reasoning": "<concise explanation>"
    }
     
    Return ONLY the raw JSON object.`

    const response = await evaluatorModel.invoke([new HumanMessage({ content: prompt })]);
    const responseText = (response.content as string).replace(/```json|```/g, "").trim();

    try {
        const prased = JSON.parse(responseText);
        return {
            score: prased.score ?? 0,
            isRelevant: (prased.score ?? 0) >= 0.75,
            reasoning: prased.reasoning || "Evaluated successfully"
        }
    } catch {
        return {
            score: 0,
            isRelevant: false,
            reasoning: "Failed to parse JSON evaluation response"
        }
    }
}
