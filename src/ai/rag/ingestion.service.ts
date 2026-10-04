import { recursiveCharChunking } from "./chunking.service.js";
import { insertDocsKnowledge } from "./vector.repository.js";

export interface IngestDocumentPayload {
    title: string;
    rawContent: string;
    category: "COMPLIANCE_POLICY" | "LEDGER_AUDIT" | "USER_PREFERENCE";
    userId?: string;
}
export async function ingestDocument(payload: IngestDocumentPayload): Promise<{
    totalChunks: number;
    chunkIds: string[];
}> {
    const chunks = recursiveCharChunking(payload.rawContent, {
        chunkSize: 400,
        chunkOverlap: 60
    });

    console.log(`[Document Ingestion]: '${payload.title}' split into ${chunks.length} chunks.`);

    const chunkIds: string[] = [];

    for (const chunk of chunks) {
        const id = await insertDocsKnowledge({
            title: `${payload.title} (Part ${chunk.chunkIndex + 1})`,
            content: chunk.text,
            category: payload.category,
            userId: payload.userId
        });
        chunkIds.push(id);
    }

    return {
        totalChunks: chunks.length,
        chunkIds
    };
}
