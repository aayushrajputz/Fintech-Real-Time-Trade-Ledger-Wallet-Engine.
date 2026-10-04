import { prisma } from "../../config/db.js";
import { searchSimilarDocs, KnowledgeRecord } from "./vector.repository.js";

export interface HybridSearchResult {
    id: string;
    title: string;
    content: string;
    category: string;
    rrfScore: number;
    vectorRand?: number;
    keywordRank?: number;
}


export async function executeKeywordSearch(query: string, limit = 5): Promise<KnowledgeRecord[]> {
    const formattedQuery = query.trim().replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter((w) => w.length > 2).join(" | ");


    if (!formattedQuery) return [];

    try {
        const results = await prisma.$queryRaw<KnowledgeRecord[]>`
        SELECT
        id,
        title,
        content,
        category,
        ts_rank(to_tsvector('english',content), to_tsquery('english', ${formattedQuery})) AS similarity FROM document_knowledge WHERE to_tsvector('english',content) @@ to_tsquery('english', ${formattedQuery}) ORDER BY similarity DESC LIMIT ${limit};
        `;
        return results
    } catch {
        return []
    }

}

export function reciprocalRankFusion(vectorResults: KnowledgeRecord[], keywordResults: KnowledgeRecord[], k = 60): HybridSearchResult[] {
    const scoresMap = new Map<string, HybridSearchResult>();

    vectorResults.forEach((doc, index) => {
        const rank = index + 1;
        const score = 1 / (k + rank);

        scoresMap.set(doc.id, {
            id: doc.id,
            title: doc.title,
            content: doc.content,
            category: doc.category,
            rrfScore: score,
            vectorRand: rank
        })

    })

    keywordResults.forEach((doc, index) => {
        const rank = index + 1;
        const score = 1 / (k + rank);

        if (scoresMap.has(doc.id)) {
            const existing = scoresMap.get(doc.id)!;
            existing.rrfScore += score;
            existing.keywordRank = rank;

        } else {
            scoresMap.set(doc.id, {
                id: doc.id,
                title: doc.title,
                content: doc.content,
                category: doc.category,
                rrfScore: score,
                keywordRank: rank
            })

        }
    })
    return Array.from(scoresMap.values()).sort((a, b) => b.rrfScore - a.rrfScore)
}


export async function performHybridSearch(query: string, limit = 3): Promise<HybridSearchResult[]> {
    const [vectorDocs, keywordDocs] = await Promise.all([
        searchSimilarDocs(query, undefined, limit),
        executeKeywordSearch(query, limit)
    ])
    const fusedResults = reciprocalRankFusion(vectorDocs, keywordDocs);
    return fusedResults.slice(0, limit)
}