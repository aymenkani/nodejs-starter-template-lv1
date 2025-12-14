# File Routes

This document describes the API routes for managing and listing uploaded files in the knowledge base.

## List Files

Retrieves a list of files based on filter criteria. Users can see their own files and public files uploaded by others.

* **URL**  
    `/v1/files`
* **Method:**  
    `GET`
* **Authentication:**  
    Required (JWT Token in `Authorization` header), User Role: `USER`
* **Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `filter` | string | No | `all` | Filter type: `all`, `mine`, or `public` |

**Filter Options:**

* `all` - Returns all files the user has access to (own private + public)
* `mine` - Returns only the user's uploaded files
* `public` - Returns only public files (uploadedby admins/contributors)

**Example Requests:**

```
GET /api/v1/files
GET /api/v1/files?filter=mine
GET /api/v1/files?filter=public
```

* **Success Response:**  
  * **Code:** `200 OK`
  * **Content:**

```json
[
  {
    "id": "file-uuid-1",
    "fileKey": "users/user-uuid/uuid-report.pdf",
    "originalName": "quarterly-report.pdf",
    "fileHash": "sha256-hash",
    "mimeType": "application/pdf",
    "status": "COMPLETED",
    "isPublic": false,
    "userId": "user-uuid",
    "createdAt": "2025-12-13T10:30:00.000Z",
    "updatedAt": "2025-12-13T10:31:00.000Z",
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "username": "johndoe"
    }
  },
  {
    "id": "file-uuid-2",
    "fileKey": "users/admin-uuid/uuid-handbook.pdf",
    "originalName": "employee-handbook.pdf",
    "fileHash": "sha256-hash-2",
    "mimeType": "application/pdf",
    "status": "COMPLETED",
    "isPublic": true,
    "userId": "admin-uuid",
    "createdAt": "2025-12-10T08:00:00.000Z",
    "updatedAt": "2025-12-10T08:02:00.000Z",
    "user": {
      "id": "admin-uuid",
      "email": "admin@example.com",
      "username": "admin"
    }
  }
]
```

**Response Properties:**

* `id` (string): Unique file identifier (UUID)
* `fileKey` (string): S3/R2 object key
* `originalName` (string): Original filename from upload
* `fileHash` (string | null): SHA-256 hash for deduplication
* `mimeType` (string): File MIME type
* `status` (string): Processing status - `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `DUPLICATE`
* `isPublic` (boolean): Whether file is accessible to all users
* `userId` (string): Owner's user ID
* `createdAt` (string): ISO 8601 timestamp
* `updatedAt` (string): ISO 8601 timestamp
* `user` (object): File owner details
  * `id` (string): User UUID
  * `email` (string): User email
  * `username` (string): Username

* **Error Responses:**  
  * **Code:** `401 Unauthorized`  
    ```json
    {
      "code": 401,
      "message": "Please authenticate"
    }
    ```

## File Status Meanings

| Status | Description |
|--------|-------------|
| `PENDING` | File reservation created, awaiting upload confirmation |
| `PROCESSING` | Background worker is ingesting and creating embeddings |
| `COMPLETED` | Successfully processed and indexed for search |
| `FAILED` | Processing error (corrupt file, extraction failure) |
| `DUPLICATE` | SHA-256 hash matched an existing file (auto-deduplicated) |

## Access Control

**Private Files** (`isPublic: false`):
- Only visible to the file owner
- Used in RAG search for that user only

**Public Files** (`isPublic: true`):
- Visible to all users
- Used in RAG search for everyone
- Only `ADMIN` and `CONTRIBUTOR` roles can create public files

## Implementation Details

**Backend Code** (`file.controller.ts`):

```typescript
const listFiles = async (req: Request, res: Response, next: NextFunction) => {
  const { filter } = req.query;
  const userId = (req.user as any).id;

  let where: any = {};

  switch (filter) {
    case 'mine':
      where = { userId };
      break;
    case 'public':
      where = { isPublic: true };
      break;
    case 'all':
    default:
      where = {
        OR: [{ userId }, { isPublic: true }]
      };
  }

  const files = await prisma.file.findMany({
    where,
    include: { user: { select: { id: true, email: true, username: true } } },
    orderBy: { createdAt: 'desc' }
  });

  res.send(files);
};
```

## Client Example

**JavaScript (Frontend)**:

```javascript
// Get all accessible files
const response = await fetch('/api/v1/files', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const files = await response.json();

// Filter on client side (or use query param)
const completedFiles = files.filter(f => f.status === 'COMPLETED');
const publicFiles = files.filter(f => f.isPublic);
```

## Notes

* Files are returned in **descending order** by `createdAt` (newest first)
* The `fileKey` can be used to generate presigned download URLs via the upload service
* DUPLICATE files are kept in the database for tracking but don't consume additional storage
* Files in PENDING status for >24 hours are automatically cleaned up

## Related Documentation

* [File Upload Architecture](../file-upload-architecture.md) - How files are uploaded
* [RAG Intelligence Pipeline](../rag-intelligence-pipeline.md) - How files are indexed
* [Upload Routes](upload-routes.md) - Upload API endpoints
