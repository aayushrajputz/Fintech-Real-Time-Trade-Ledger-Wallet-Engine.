
export interface ChunkOptions {
    chunkSize?: number;
    chunkOverlap?: number;
    seprators?: string[]

}

export interface DocsChunk {
    text: string;
    chunkIndex: number;
    charCount: number;
}

export function recursiveCharChunking(text: string, opt: ChunkOptions = {}): DocsChunk[] {
    const {
        chunkSize = 500,
        chunkOverlap = 80,
        seprators = ["\n\n", "\n", " ", ""]
    } = opt;

    const rawChunks: string[] = [];

    function splitText(currentText: string, sepratorIndex: number) {
        if (currentText.length <= chunkSize || sepratorIndex >= seprators.length) {
            if (currentText.trim().length > 0) {
                rawChunks.push(currentText.trim());
            }
            return;
        }

        const currentSeperator = seprators[sepratorIndex];
        const splits = currentText.split(currentSeperator);

        let currentBuffer = ""

        for (const part of splits) {
            const candidate = currentBuffer ? `${currentBuffer}${currentSeperator}${part} ` : part;
            if (candidate.length <= chunkSize) {
                currentBuffer = candidate;

            } else {
                if (currentBuffer) {
                    rawChunks.push(currentBuffer.trim())
                }
                if (part.length > chunkSize) {
                    splitText(part, sepratorIndex + 1)
                    currentBuffer = ""
                } else {
                    currentBuffer = part
                }
            }
        }

        if (currentBuffer.trim()) {
            rawChunks.push(currentBuffer.trim())
        }


    }
    splitText(text, 0)
    const finalizedChunks: DocsChunk[] = [];

    for (let i = 0; i < rawChunks.length; i++) {
        let chunkText = rawChunks[i];

        if (i > 0 && chunkOverlap > 0) {
            const prev = rawChunks[i - 1];
            const overlapText = prev.slice(-chunkOverlap);
            chunkText = `${overlapText} ... ${chunkText}`;
        }
        finalizedChunks.push({
            text: chunkText,
            chunkIndex: i,
            charCount: chunkText.length
        });
    }
    return finalizedChunks;
}