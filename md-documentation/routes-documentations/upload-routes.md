# Upload Routes

This document describes the API routes related to file uploads, specifically for generating signed URLs to securely upload files directly to AWS S3.

## Generate Signed URL

Generates a pre-signed URL that allows a client to upload a file directly to an AWS S3 bucket. This route is protected and requires authentication with a `USER` role.

*   **URL**
    `/v1/upload/generate-signed-url`
*   **Method:**
    `POST`
*   **Authentication:**
    Required (JWT Token in `Authorization` header), User Role: `USER`
*   **Request Body:**
    The request body should be a JSON object containing the file details.

    ```json
    {
      "fileName": "string",
      "fileType": "string",
      "fileSize": "number"
    }
    ```

    **Properties:**
    *   `fileName` (string, required): The desired name of the file in the S3 bucket.
    *   `fileType` (string, required): The MIME type of the file.
        *   **Allowed values:** `image/jpeg`, `image/png`, `image/gif`, `image/webp`
        *   **Validation:** If an invalid file type is provided, a `400 Bad Request` error will be returned.
    *   `fileSize` (number, required): The size of the file in bytes.
        *   **Maximum allowed:** 5 MB (5 * 1024 * 1024 bytes)
        *   **Validation:** If the file size exceeds 5MB, a `400 Bad Request` error will be returned.

*   **Success Response:**
    *   **Code:** `200 OK`
    *   **Content:** A JSON object containing the signed URL.

    ```json
    {
      "signedUrl": "string (URL)"
    }
    ```

    **Properties:**
    *   `signedUrl` (string): A pre-signed URL that can be used to upload the file directly to AWS S3. This URL is valid for 5 minutes.

*   **Error Responses:**
    *   **Code:** `400 Bad Request`
        *   **Content:**
            ```json
            {
              "code": 400,
              "message": "Invalid file type. Only JPEG, PNG, GIF, and WEBP images are allowed."
            }
            ```
            or
            ```json
            {
              "code": 400,
              "message": "File size must be less than 5MB."
            }
            ```
    *   **Code:** `401 Unauthorized`
        *   **Content:**
            ```json
            {
              "code": 401,
              "message": "Please authenticate"
            }
            ```
    *   **Code:** `403 Forbidden`
        *   **Content:**
            ```json
            {
              "code": 403,
              "message": "Forbidden"
            }
            ```
