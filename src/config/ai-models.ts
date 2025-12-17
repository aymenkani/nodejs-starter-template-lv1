export const aiModels = {
  ingestion: {
    /**
     * Model used to analyze images and extract text descriptors during file ingestion.
     * It processes images before chunking and embedding.
     */
    imageAnalysis: 'gemini-2.5-flash-lite',
    /**
     * Model used to generate vector embeddings for document chunks during ingestion.
     * Must match the embedding model used in the agent service.
     */
    embedding: 'text-embedding-004',
  },
  agent: {
    /**
     * Model used to rewrite the user's latest message into a standalone search query.
     * This improves retrieval accuracy by resolving references in the conversation history.
     */
    queryRewriter: 'gemini-2.5-flash-lite',
    /**
     * Main chat model used to generate the final response to the user.
     * It uses the retrieved context to answer the user's question.
     */
    chat: 'gemini-2.5-flash-lite',
    /**
     * Model used to generate embeddings for the search query to match against the document vector store.
     * MUST match the embedding model used during ingestion.
     */
    embedding: 'text-embedding-004',
  },
};
