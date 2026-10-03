
import { prisma } from "../../config/db.js";
import { generateEmbedding } from "./embedding.service.js";

export interface KnowledgeRecord {
    id: string;
    title: string;
    content: string;
    category: string;
    similarity: number;
}

export async function insertDocsKnowledge(data: {
    title: string;
    content: string;
    category: string;
    userId?: string;

}): Promise<string> {
    const embedding = await generateEmbedding(data.content);
    const vectorString = `[${embedding.join(",")}]`;

    const result = await prisma.$queryRaw<{ id: string }[]>`
        INSERT INTO document_knowledge (title, content, category, user_id, embedding, updated_at)
        VALUES (
            ${data.title},
            ${data.content},
            ${data.category},
            ${data.userId ?? null},
            ${vectorString}::vector,
            CURRENT_TIMESTAMP
        )
        RETURNING id;
    `;

    return result[0].id;
}

export async function searchSimilarDocs(
    queryText: string,
    category?: string,
    limit = 5

): Promise<KnowledgeRecord[]> {
    const queryEmbedding = await generateEmbedding(queryText);
    const vectorString = `[${queryEmbedding.join(",")} ]`

    const results = await prisma.$queryRaw<KnowledgeRecord[]>`
    SELECT
    id,
    title,
    content,
    category,
    ROUND((1-(embedding <=> ${vectorString}::vector))::numeric, 4) AS similarity
    FROM document_knowledge
    WHERE (${category}::text IS NULL OR category = ${category})
    ORDER BY embedding <=> ${vectorString}::vector
    LIMIT ${limit};
    `;
    return results

}