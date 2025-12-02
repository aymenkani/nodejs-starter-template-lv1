# User Routes Documentation

This section provides a detailed breakdown of the authenticated user API routes, outlining their purpose, the flow of requests through middleware, controllers, and services, and the expected responses. All user routes require authentication with a `USER` or `ADMIN` role.

## Global User Middleware

All routes defined in `src/api/user.routes.ts` are protected by the following middleware:

* `auth`: Ensures the request has a valid JWT and authenticates the user.
* `authorize([Role.USER])`: Checks if the authenticated user has at least the `USER` role.

This means that any request to these endpoints must include a valid JWT for an authenticated user.

---

## 1. Get User Profile

**Endpoint:** `GET /v1/user/profile`
**Description:** Retrieves the profile information of the authenticated user.

### Flow Map

1.  **Initial Request:**
*   **Method:** `GET`
*   **Path:** `/v1/user/profile`
*   **Client Sends:** No request body or parameters. A valid JWT for an authenticated user in the `Authorization` header.

2.  **Route Handler (`src/api/user.routes.ts`):**
```typescript
router.get('/profile', userController.getProfile);
```
*   The request first passes through the global `auth` and `authorize([Role.USER])` middleware, ensuring the user is authenticated and authorized.
*   If authorized, the request is forwarded to `userController.getProfile`.

3.  **Controller (`src/controllers/user.controller.ts`):**
```typescript
const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const authenticatedUser = req.user;
    const user = await userService.getUserById(authenticatedUser.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const {
      password: _userPassword,
      passwordHistory: _passwordHistory,
      ...userWithoutPassword
    } = user;
    res.status(200).json({ success: true, data: userWithoutPassword });
  } catch (error) {
    next(error);
  }
};
```
*   The controller verifies `req.user` is populated by the authentication middleware.
*   It retrieves the full user object from the database using `userService.getUserById()` based on the authenticated user's ID.
*   If the user is not found (which should ideally not happen after authentication), it returns a `404 Not Found` error.
*   It destructures the `password` and `passwordHistory` fields from the user object to prevent sending sensitive data in the response.
*   Sends a `200 OK` response with the user's profile data.
*   Any errors are caught and passed to the Express error handling middleware.

4.  **Service (`src/services/user.service.ts`):**
```typescript
const getUserById = async (id: string): Promise<User | null> => {
  return prisma.user.findUnique({ where: { id } });
};
```
*   The service uses the Prisma client (`prisma.user.findUnique()`) to query the database for a user record by their ID.
*   It returns the `User` object or `null` if not found.

5.  **Response to Client:**
*   **Status:** `200 OK`
*   **Body (JSON):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-of-user",
    "username": "johndoe",
    "email": "john.doe@example.com",
    "role": "USER",
    "googleId": null,
    "provider": "LOCAL",
    "createdAt": "2023-01-01T12:00:00.000Z",
    "updatedAt": "2023-01-01T12:00:00.000Z"
  }
}
```
*   **Error Responses:**
*   `401 Unauthorized`: If no valid JWT is provided or the token is expired/invalid.
*   `403 Forbidden`: If the authenticated user does not have the `USER` role.
*   `404 Not Found`: If the user is not found in the database (unlikely after authentication).
*   `500 Internal Server Error`: For unexpected server-side errors.

---

## 2. Update User Email

**Endpoint:** `PUT /v1/user/profile/email`
**Description:** Updates the authenticated user's email address after verifying their current password.

### Flow Map

1.  **Initial Request:**
*   **Method:** `PUT`
*   **Path:** `/v1/user/profile/email`
*   **Client Sends:**
*   A valid JWT for an authenticated user in the `Authorization` header.
*   **Request Body (JSON):**
```json
{
  "email": "new.email@example.com",
  "password": "current_password123"
}
```

2.  **Route Handler (`src/api/user.routes.ts`):**
```typescript
router.put('/profile/email', validate(userValidation.updateEmail), userController.updateEmail);
```
*   The request first passes through the global `auth` and `authorize([Role.USER])` middleware.
*   Then, `validate(userValidation.updateEmail)` middleware validates the request body against the `userValidation.updateEmail` Zod schema, ensuring `email` and `password` are present and valid.
*   If validation passes, the request is forwarded to `userController.updateEmail`.

3.  **Controller (`src/controllers/user.controller.ts`):**
```typescript
const updateEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const { email, password } = req.body;
    const authenticatedUser = req.user;
    const updatedUser = await userService.updateUserEmail(authenticatedUser.id, email, password);
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found or password incorrect' });
    }
    const {
      password: _userPassword,
      passwordHistory: _passwordHistory,
      ...userWithoutPassword
    } = updatedUser;
    res.status(200).json({ success: true, data: userWithoutPassword });
  } catch (error) {
    next(error);
  }
};
```
*   The controller verifies `req.user` is populated.
*   It extracts `email` and `password` from `req.body`.
*   It calls `userService.updateUserEmail()` with the authenticated user's ID, the new email, and the current password.
*   If the update is successful, it destructures the `password` and `passwordHistory` fields from the updated user object.
*   Sends a `200 OK` response with the updated user data.
*   Any errors are caught and passed to the Express error handling middleware.

4.  **Service (`src/services/user.service.ts`):**
```typescript
const updateUserEmail = async (
  userId: string,
  newEmail: string,
  currentPassword: string,
): Promise<User | null> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.password) {
    throw new Error('User not found or does not have a password set.');
  }

  const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordMatch) {
    throw new Error('Incorrect password'); // This will be caught by ApiError middleware
  }

  return prisma.user.update({
    where: { id: userId },
    data: { email: newEmail },
  });
};
```
*   The service first retrieves the user by `userId`.
*   It compares the `currentPassword` provided by the user with the stored hashed password using `bcrypt.compare()`. If they don't match, it throws an error.
*   If the password is correct, it updates the user's `email` in the database using `prisma.user.update()`.
*   Returns the updated `User` object or `null`.

5.  **Response to Client:**
*   **Status:** `200 OK`
*   **Body (JSON):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-of-user",
    "username": "johndoe",
    "email": "new.email@example.com",
    "role": "USER",
    "googleId": null,
    "provider": "LOCAL",
    "createdAt": "2023-01-01T12:00:00.000Z",
    "updatedAt": "2023-01-01T12:00:00.000Z"
  }
}
```
*   **Error Responses:**
*   `400 Bad Request`: If validation fails.
*   `401 Unauthorized`: If no valid JWT is provided, or if the provided current password is incorrect.
*   `403 Forbidden`: If the authenticated user does not have the `USER` role.
*   `404 Not Found`: If the user is not found in the database.
*   `500 Internal Server Error`: For unexpected server-side errors.
