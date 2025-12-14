# Agent Routes

This document describes the API routes for the AI agent that powers the RAG (Retrieval-Augmented Generation) intelligent chat feature.

## Chat with AI Agent

Streams an AI-generated response based on uploaded documents and conversation history.

* **URL**  
    `/v1/agent/chat`
* **Method:**  
    `POST`
* **Authentication:**  
    Required (JWT Token in `Authorization` header), User Role: `USER`
* **Request Body:**  
    The request body should be a JSON object containing the conversation messages:

```json
{
  "messages": [
    {
      "role": "user",
      "content": "What is the company's vacation policy?"
    }
  ]
}
```

**Properties:**
* `messages` (array, required): Array of message objects following the AI SDK format
  * Each message has:
    * `role` (string): Either `"user"` or `"assistant"`
    * `content` (string): The message text

**Conversation History Example:**

```json
{
  "messages": [
    { "role": "user", "content": "Who is the CEO?" },
    { "role": "assistant", "content": "According to the handbook, John Doe is the CEO." },
    { "role": "user", "content": "What's his email?" }
  ]
}
```

* **Success Response:**  
  * **Code:** `200 OK`
  * **Content-Type:** `text/event-stream` (Server-Sent Events)
  * **Body:** AI response streamed in real-time

**Stream Format:**

```
data: The
data:  CEO's
data:  email
data:  is
data:  john@company.com
data: .
```

**Example Response (concatenated):**

```
The CEO's email is john@company.com. [Source: employee-handbook.pdf](https://r2.cloudflarestorage.com/...)
```

* **Error Responses:**  
  * **Code:** `400 Bad Request`  
    ```json
    {
      "code": 400,
      "message": "Messages content is required"
    }
    ```
  * **Code:** `401 Unauthorized`  
    ```json
    {
      "code": 401,
      "message": "Please authenticate"
    }
    ```
  * **Code:** `500 Internal Server Error`  
    ```json
    {
      "code": 500,
      "message": "AI service unavailable"
    }
    ```

## How It Works

### 1. Query Rewriting

If the conversation has multiple messages, the system uses Gemini to rewrite the last query into a standalone search query:

```
User: "Who is Elon Musk?"
AI: "He is the CEO of Tesla and SpaceX."
User: "How old is he?"

→ System rewrites: "How old is Elon Musk?"
```

### 2. Semantic Search

The system:
1. Converts the query to a 768-dimension vector embedding
2. Searches the pgvector database for similar content
3. Filters results to only show:
   - User's own private documents
   - Any public documents (uploaded by admins)

### 3. Smart Citations

For each retrieved document, the system generates a temporary presigned URL (valid 1 hour) so the AI can link to sources:

```
[Source: company-handbook.pdf](https://signed-url-expires-in-1h.com/...)
```

### 4. Streaming Response

The AI generates a response using **Google Gemini's streaming API**, sending chunks as they're generated for a better user experience.

## Rate Limiting

No specific rate limit on this endpoint, but the underlying Google AI API has usage quotas. See [Google AI pricing](https://ai.google.dev/pricing).

## Client Example

**JavaScript (Frontend)**:

```javascript
const response = await fetch('/api/v1/agent/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ messages })
});

// Handle streaming response
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  console.log(chunk); // Append to UI
}
```

## Notes

* The AI only answers based on **uploaded documents**. If no relevant documents are found, it will say "I don't know."
* Presigned URLs in citations expire after **1 hour**. Users should download files if needed for longer access.
* The system uses **hybrid search** (vector similarity + metadata filtering) for optimal retrieval.

## Related Documentation

* [RAG Intelligence Pipeline](../rag-intelligence-pipeline.md) - Detailed architecture
* [File Upload Architecture](../file-upload-architecture.md) - How documents are ingested
* [File Routes](file-routes.md) - Managing uploaded files
