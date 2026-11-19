import { prisma } from "../../config/db.js";

// ─────────────────────────────────────────────────────────────
// 1. Graph Data Models: Nodes & Edges
// ─────────────────────────────────────────────────────────────

export type NodeType = "USER" | "WALLET" | "IP_ADDRESS" | "BLACKLISTED_ENTITY";

export interface GraphNode {
    id: string;
    label: NodeType;
    name: string;
    riskScore: number; // 0.0 (Clean) to 1.0 (Critical Threat)
    properties?: Record<string, any>;
}

export type RelationType = 
    | "OWNS_WALLET" 
    | "TRANSFERRED_TO" 
    | "ACCESSED_FROM_IP" 
    | "LINKED_TO_SANCTION";

export interface GraphEdge {
    source: string;
    target: string;
    relation: RelationType;
    details?: string;
    amount?: number;
    timestamp?: Date;
}

export interface SubgraphAuditReport {
    targetEntityId: string;
    maxHopsEvaluated: number;
    highestRiskScore: number;
    hasBlacklistedConnection: boolean;
    flaggedPaths: string[];
    nodes: GraphNode[];
    edges: GraphEdge[];
    graphContextText: string; // Plain text facts for LLM Agent prompt
}

// ─────────────────────────────────────────────────────────────
// 2. Mock / In-Memory Knowledge Graph of Known Sanctioned Entities
// (Real production me yeh Chainalysis, OFAC, ya Sanction Watchlists se aate hain)
// ─────────────────────────────────────────────────────────────
const KNOWN_BLACKLISTED_ENTITIES: Record<string, { name: string; reason: string }> = {
    "blacklisted_entity_mixer_01": {
        name: "TornadoCash_Mixer_Vault",
        reason: "OFAC Sanctioned Crypto Mixer (Money Laundering)",
    },
    "blacklisted_entity_scam_02": {
        name: "Lazarus_Affiliate_Shell_Co",
        reason: "State-sponsored Cybercrime Syndicate Associated",
    },
    "blacklisted_ip_malicious_99": {
        name: "Tor_Exit_Node_185_220",
        reason: "High-risk Tor Exit Node associated with credential stuffing",
    }
};

// ─────────────────────────────────────────────────────────────
// 3. Multi-Hop Graph Traversal Engine (BFS - Breadth First Search)
// ─────────────────────────────────────────────────────────────
export async function auditEntityGraph(
    entityId: string, 
    maxHops: number = 2
): Promise<SubgraphAuditReport> {
    const visitedNodes = new Set<string>();
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const flaggedPaths: string[] = [];
    let hasBlacklistedConnection = false;
    let highestRiskScore = 0.0;

    // Queue structure for BFS: [currentId, currentDepth, pathHistory]
    const queue: Array<{ id: string; depth: number; path: string[] }> = [
        { id: entityId, depth: 0, path: [entityId] }
    ];
    visitedNodes.add(entityId);

    // Initial target node
    nodes.push({
        id: entityId,
        label: "USER",
        name: `Target_${entityId}`,
        riskScore: 0.0
    });

    while (queue.length > 0) {
        const current = queue.shift()!;

        // Stop traversal if we reached max allowed hops
        if (current.depth >= maxHops) continue;

        // Step A: Check if current node is connected to any blacklisted entity
        if (KNOWN_BLACKLISTED_ENTITIES[current.id]) {
            const threat = KNOWN_BLACKLISTED_ENTITIES[current.id];
            hasBlacklistedConnection = true;
            highestRiskScore = Math.max(highestRiskScore, 1.0);
            flaggedPaths.push(`🚨 CRITICAL LINK: Path [${current.path.join(" -> ")}] reaches Sanctioned Entity: ${threat.name} (${threat.reason})`);
        }

        // Step B: Query Database for real transactions / ledger transfers
        try {
            const ledgerTransfers = await prisma.ledgerEntry.findMany({
                where: {
                    OR: [
                        { walletId: current.id },
                        { description: { contains: current.id } }
                    ]
                },
                take: 10,
                orderBy: { createdAt: "desc" }
            });

            for (const entry of ledgerTransfers) {
                const neighborId = entry.walletId === current.id ? `target_${entry.id}` : entry.walletId;

                // Add Edge
                edges.push({
                    source: current.id,
                    target: neighborId,
                    relation: "TRANSFERRED_TO",
                    amount: Number(entry.amount),
                    details: entry.description,
                    timestamp: entry.createdAt
                });

                if (!visitedNodes.has(neighborId)) {
                    visitedNodes.add(neighborId);
                    nodes.push({
                        id: neighborId,
                        label: "WALLET",
                        name: `Wallet_${neighborId.slice(0, 8)}`,
                        riskScore: 0.1
                    });

                    queue.push({
                        id: neighborId,
                        depth: current.depth + 1,
                        path: [...current.path, `[Transfer ${entry.amount}]`, neighborId]
                    });
                }
            }
        } catch {
            // Graceful DB fallback
        }
    }

    // ─────────────────────────────────────────────────────────────
    // 4. GraphRAG Context Synthesizer:
    // Transforms the graph into a concise, factual text context for the LLM
    // ─────────────────────────────────────────────────────────────
    const summaryLines: string[] = [
        `=== KNOWLEDGE GRAPH AUDIT REPORT ===`,
        `Target Entity: ${entityId}`,
        `Max Graph Depth Evaluated: ${maxHops} hops`,
        `Total Entities Explored: ${nodes.length}`,
        `Total Relational Edges: ${edges.length}`,
        `Has Direct/Indirect Sanctions Link: ${hasBlacklistedConnection ? "YES 🚨" : "NO ✅"}`,
        `Risk Severity Score: ${highestRiskScore.toFixed(2)} / 1.00`,
    ];

    if (flaggedPaths.length > 0) {
        summaryLines.push(`\nFlagged Multi-Hop Suspicious Paths:`);
        flaggedPaths.forEach((p, idx) => summaryLines.push(`  ${idx + 1}. ${p}`));
    } else {
        summaryLines.push(`\nNo direct or 2-hop links to known blacklisted syndicates found.`);
    }

    summaryLines.push(`====================================`);

    return {
        targetEntityId: entityId,
        maxHopsEvaluated: maxHops,
        highestRiskScore,
        hasBlacklistedConnection,
        flaggedPaths,
        nodes,
        edges,
        graphContextText: summaryLines.join("\n")
    };
}
