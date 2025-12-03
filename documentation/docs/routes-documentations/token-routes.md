# Token Routes Documentation

This section provides a detailed breakdown of the token management API routes, specifically focusing on refreshing authentication tokens. The documentation outlines the purpose of the route, the flow of requests through middleware, controllers, and services, and the expected responses.

---

## 1. Refresh Tokens

**Endpoint:** `POST /v1/token/refresh`
**Description:** Refreshes an expired access token using a valid refresh token. This route issues a new access token and a new refresh token.

### Flow Map

1.  **Initial Request:**
*   **Method:** `POST`
*   **Path:** `/v1/token/refresh`
*   **Client Sends:**
*   **Cookie:** `refreshToken=<jwt-refresh-token>` (an HTTP-only cookie containing the refresh token).
*   No request body or parameters.

2.  **Route Handler (`src/api/token.routes.ts`):**
```typescript
router.post('/refresh', validate(authValidation.refreshTokens), tokenController.refreshTokens);
```
*   The request first passes through the `validate(authValidation.refreshTokens)` middleware. This middleware uses the Zod schema defined in `authValidation.refreshTokens` to ensure a `refreshToken` cookie is present.
*   If validation passes, the request is forwarded to `tokenController.refreshTokens`.

3.  **Controller (`src/controllers/token.controller.ts`):**
```typescript
const refreshTokens = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) throw new ApiError(400, 'No refresh token provided');
    const tokens = await tokenService.refreshAuthTokens(refreshToken);
    res.cookie('refreshToken', tokens.refresh.token, {
      httpOnly: true,
      expires: tokens.refresh.expires,
    });
    res.send({ access: tokens.access });
  } catch (error) {
    next(error);
  }
};
```
*   The controller extracts the `refreshToken` from `req.cookies`.
*   It performs a check to ensure the `refreshToken` exists. If not, it throws an `ApiError` (400 Bad Request).
*   It calls `tokenService.refreshAuthTokens()` with the extracted refresh token.
*   Upon successful token refresh, it sets a **new** `refreshToken` as an HTTP-only cookie with its new expiration.
*   It sends a `200 OK` response with a JSON object containing the new `access` token.
*   Any errors are caught and passed to the Express error handling middleware.

4.  **Service (`src/services/token.service.ts`):**
*   `tokenService.refreshAuthTokens(refreshToken)`:
```typescript
const refreshAuthTokens = async (refreshToken: string) => {
  try {
    const refreshTokenPayload = verifyToken(refreshToken) as jwt.JwtPayload;
    const user = await prisma.user.findUnique({ where: { id: refreshTokenPayload.sub } });
    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid refresh token');
    }

    await prisma.refreshToken.delete({ where: { token: refreshToken } }); // Delete old refresh token
    return generateAuthTokens(user); // Generate new access and refresh tokens
  } catch (error) {
    const errorStack = error instanceof Error ? error.stack : undefined;
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid refresh token', true, errorStack);
  }
};
```
*   Calls `verifyToken()` to validate the provided `refreshToken`. If invalid, it throws a `401 Unauthorized` error.
*   Extracts the `userId` (`sub`) from the refresh token's payload.
*   Retrieves the user from the database using `prisma.user.findUnique()`. If the user is not found, it throws a `401 Unauthorized` error.
*   Deletes the *old* refresh token from the `RefreshToken` Prisma model in the database, ensuring it cannot be reused.
*   Calls `generateAuthTokens(user)` to create a brand new access token and a new refresh token.
*   Returns an object containing the new `access` and `refresh` tokens, each with their token string and expiration date.

5.  **Response to Client:**
*   **Status:** `200 OK`
*   **Body (JSON):**
```json
{
  "access": {
    "token": "new-jwt-access-token",
    "expires": "2023-01-01T12:30:00.000Z"
  }
}
```
*   **Cookie:** `refreshToken=new-jwt-refresh-token; HttpOnly; Expires=...`
*   **Error Responses:**
*   `400 Bad Request`: If no refresh token is provided in the cookie.
*   `401 Unauthorized`: If the refresh token is invalid, expired, or the associated user is not found.
*   `500 Internal Server Error`: For unexpected server-side errors.