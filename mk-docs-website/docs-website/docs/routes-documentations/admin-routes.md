# Admin Routes Documentation

This section provides a detailed breakdown of the administrative API routes, outlining their purpose, the flow of requests through middleware, controllers, and services, and the expected responses. All admin routes are protected and require authentication with an `ADMIN` role.

## Global Admin Middleware

All routes defined in `src/api/admin.routes.ts` are protected by the following middleware:

* `auth`: Ensures the request has a valid JWT and authenticates the user.
* `authorize([Role.ADMIN])`: Checks if the authenticated user has the `ADMIN` role. If not, access is denied.

This means that any request to these endpoints must include a valid JWT for an administrator user.

---

## 1. Get All Users

**Endpoint:** `GET /v1/admin/users`
**Description:** Retrieves a list of all registered users in the system.

### Flow Map

1.  **Initial Request:**
*   **Method:** `GET`
*   **Path:** `/v1/admin/users`
*   **Client Sends:** No request body or parameters. A valid JWT for an admin user in the `Authorization` header.

2.  **Route Handler (`src/api/admin.routes.ts`):**
```typescript
router.get('/users', adminController.getAllUsers);
```
*   The request first passes through the global `auth` and `authorize([Role.ADMIN])` middleware, ensuring the user is authenticated and has admin privileges.
*   If authorized, the request is forwarded to `adminController.getAllUsers`.

3.  **Controller (`src/controllers/admin.controller.ts`):**
```typescript
const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await adminService.getAllUsers();
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error); // Pass error to error handling middleware
  }
};
```
*   The controller calls `adminService.getAllUsers()` to fetch all user data.
*   Upon successful retrieval, it sends a `200 OK` response with a JSON object containing `success`, `count` of users, and the `data` array of users.
*   Any errors are caught and passed to the Express error handling middleware.

4.  **Service (`src/services/admin.service.ts`):**
```typescript
const getAllUsers = async (): Promise<User[]> => {
  return prisma.user.findMany();
};
```
*   The service directly uses the Prisma client (`prisma.user.findMany()`) to query the database for all user records.
*   It returns an array of `User` objects.

5.  **Response to Client:**
*   **Status:** `200 OK`
*   **Body (JSON):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "uuid-of-user-1",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "ADMIN",
      "isEmailVerified": true,
      "createdAt": "2023-01-01T12:00:00.000Z",
      "updatedAt": "2023-01-01T12:00:00.000Z"
    },
    {
      "id": "uuid-of-user-2",
      "name": "Regular User",
      "email": "user@example.com",
      "role": "USER",
      "isEmailVerified": true,
      "createdAt": "2023-01-02T12:00:00.000Z",
      "updatedAt": "2023-01-02T12:00:00.000Z"
    }
  ]
}
```
*   **Error Responses:**
*   `401 Unauthorized`: If no valid JWT is provided or the token is expired/invalid.
*   `403 Forbidden`: If the authenticated user does not have the `ADMIN` role.
*   `500 Internal Server Error`: For unexpected server-side errors.

---

## 2. Update User

**Endpoint:** `PUT /v1/admin/users/:userId`
**Description:** Updates an existing user's information (including sensitive fields like password) by their ID.

### Flow Map

1.  **Initial Request:**
*   **Method:** `PUT`
*   **Path:** `/v1/admin/users/some-user-id`
*   **Client Sends:**
*   Valid JWT for an admin user in the `Authorization` header.
*   **Path Parameter:** `userId` (e.g., `some-user-id`).
*   **Request Body (JSON):** `Partial<User>` object containing fields to update (e.g., `{ "name": "New Name", "email": "new@example.com", "password": "newpassword" }`).

2.  **Route Handler (`src/api/admin.routes.ts`):**
```typescript
router.put('/users/:userId', validate(adminValidation.updateUser), adminController.updateUser);
```
*   The request first passes through the global `auth` and `authorize([Role.ADMIN])` middleware.
*   Then, `validate(adminValidation.updateUser)` middleware validates the `userId` path parameter and the request body against the `adminValidation.updateUser` Zod schema.
*   If validation passes, the request is forwarded to `adminController.updateUser`.

3.  **Controller (`src/controllers/admin.controller.ts`):**
```typescript
const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updatedUser = await adminService.updateUserAsAdmin(req.params.userId, req.body);
    const { password, ...userWithoutPassword } = updatedUser; // Exclude password from response
    res.status(200).json({ success: true, data: userWithoutPassword });
  } catch (error) {
    next(error);
  }
};
```
*   The controller extracts `userId` from `req.params` and the update data from `req.body`.
*   It calls `adminService.updateUserAsAdmin()` with the user ID and update body.
*   Upon successful update, it destructures the `password` field from the `updatedUser` object to prevent sending it in the response.
*   Sends a `200 OK` response with the updated user data (excluding password).
*   Any errors are caught and passed to the Express error handling middleware.

4.  **Service (`src/services/admin.service.ts`):**
```typescript
const updateUserAsAdmin = async (userId: string, updateBody: Partial<User>): Promise<User> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const updatedUser: Partial<User> = { ...updateBody };

  if (updateBody.password) {
    // Password history check
    if (user.passwordHistory) {
      for (const oldHashedPassword of user.passwordHistory) {
        if (await bcrypt.compare(updateBody.password, oldHashedPassword)) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            'New password cannot be one of the recently used passwords',
          );
        }
      }
    }

    const hashedPassword = await bcrypt.hash(updateBody.password, 10);
    const passwordHistoryLimit = 5;
    const updatedPasswordHistory = [hashedPassword, ...(user.passwordHistory || [])].slice(
      0,
      passwordHistoryLimit,
    );

    updatedUser.password = hashedPassword;
    updatedUser.passwordHistory = updatedPasswordHistory;
  }

  return prisma.user.update({
    where: { id: userId },
    data: updatedUser,
  });
};
```
*   The service first checks if the user exists. If not, it throws an `ApiError` (404 Not Found).
*   If a `password` is provided in `updateBody`, it performs a password history check (if `passwordHistory` is enabled for the user model) to prevent reuse of recent passwords.
*   The new password is then hashed using `bcryptjs`.
*   The `passwordHistory` is updated with the new hashed password, keeping a limit of the last 5 passwords.
*   Finally, it updates the user record in the database using `prisma.user.update()`.
*   Returns the updated `User` object.

5.  **Response to Client:**
*   **Status:** `200 OK`
*   **Body (JSON):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-of-user",
    "name": "New Name",
    "email": "new@example.com",
    "role": "ADMIN",
    "isEmailVerified": true,
    "createdAt": "2023-01-01T12:00:00.000Z",
    "updatedAt": "2023-01-03T10:30:00.000Z"
  }
}
```
*   **Error Responses:**
*   `400 Bad Request`: If validation fails, or new password is in history.
*   `401 Unauthorized`: If no valid JWT is provided.
*   `403 Forbidden`: If the authenticated user is not an admin.
*   `404 Not Found`: If the `userId` does not correspond to an existing user.
*   `500 Internal Server Error`: For unexpected server-side errors.

---

## 3. Delete User

**Endpoint:** `DELETE /v1/admin/users/:userId`
**Description:** Deletes a user from the system by their ID.

### Flow Map

1.  **Initial Request:**
*   **Method:** `DELETE`
*   **Path:** `/v1/admin/users/some-user-id`
*   **Client Sends:**
*   Valid JWT for an admin user in the `Authorization` header.
*   **Path Parameter:** `userId` (e.g., `some-user-id`).
*   No request body.

2.  **Route Handler (`src/api/admin.routes.ts`):**
```typescript
router.delete('/users/:userId', validate(adminValidation.deleteUser), adminController.deleteUser);
```
*   The request first passes through the global `auth` and `authorize([Role.ADMIN])` middleware.
*   Then, `validate(adminValidation.deleteUser)` middleware validates the `userId` path parameter.
*   If validation passes, the request is forwarded to `adminController.deleteUser`.

3.  **Controller (`src/controllers/admin.controller.ts`):**
```typescript
const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await adminService.deleteUser(req.params.userId);
    res.status(204).send(); // No content on successful deletion
  } catch (error) {
    next(error);
  }
};
```
*   The controller extracts `userId` from `req.params`.
*   It calls `adminService.deleteUser()` with the user ID.
*   Upon successful deletion, it sends a `204 No Content` response.
*   Any errors are caught and passed to the Express error handling middleware.

4.  **Service (`src/services/admin.service.ts`):**
```typescript
const deleteUser = async (userId: string): Promise<User> => {
  // Optionally, check if user exists before attempting to delete
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  return prisma.user.delete({
    where: { id: userId },
  });
};
```
*   The service first checks if the user exists. If not, it throws an `ApiError` (404 Not Found).
*   It then deletes the user record from the database using `prisma.user.delete()`.
*   Returns the deleted `User` object (though the controller sends 204 No Content).

5.  **Response to Client:**
*   **Status:** `204 No Content`
*   **Body:** Empty
*   **Error Responses:**
*   `400 Bad Request`: If validation fails.
*   `401 Unauthorized`: If no valid JWT is provided.
*   `403 Forbidden`: If the authenticated user is not an admin.
*   `404 Not Found`: If the `userId` does not correspond to an existing user.
*   `500 Internal Server Error`: For unexpected server-side errors.

---

## 4. Send Notification to All Users

**Endpoint:** `POST /v1/admin/notifications`
**Description:** Sends a notification message to all users. Online users receive it via WebSockets, while offline users have it persisted in the database.

### Flow Map

1.  **Initial Request:**
*   **Method:** `POST`
*   **Path:** `/v1/admin/notifications`
*   **Client Sends:**
*   Valid JWT for an admin user in the `Authorization` header.
*   **Request Body (JSON):** `{ "message": "Your notification message here" }`

2.  **Route Handler (`src/api/admin.routes.ts`):**
```typescript
router.post(
  '/notifications',
  validate(notificationValidation.sendNotification),
  adminController.sendNotificationToAll,
);
```
*   The request first passes through the global `auth` and `authorize([Role.ADMIN])` middleware.
*   Then, `validate(notificationValidation.sendNotification)` middleware validates the request body.
*   If validation passes, the request is forwarded to `adminController.sendNotificationToAll`.

3.  **Controller (`src/controllers/admin.controller.ts`):**
```typescript
const sendNotificationToAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message } = req.body;
    const users = await adminService.getAllUsers();
    const userIds = users.map((user) => user.id).filter((userId) => req.user?.id !== userId); // Exclude sender

    await notificationService.createNotificationsForUserIds(userIds, message, 'new_notification');

    res.status(httpStatus.OK).json({ success: true, message: 'Notification sent to all users.' });
  } catch (error) {
    next(error);
  }
};
```
*   The controller extracts the `message` from `req.body`.
*   It calls `adminService.getAllUsers()` to get all user IDs.
*   It filters out the sender's own ID from the list of recipients.
*   It then calls `notificationService.createNotificationsForUserIds()` to handle sending/persisting notifications.
*   Sends a `200 OK` response with a success message.
*   Any errors are caught and passed to the Express error handling middleware.

4.  **Service (`src/services/admin.service.ts` and `src/services/notification.service.ts`):**
*   `adminService.getAllUsers()`: (As described in "Get All Users" flow) Fetches all users from the database.
*   `notificationService.createNotificationsForUserIds()`:
```typescript
const createNotificationsForUserIds = async (
  userIds: string[],
  message: string,
  event: string = 'new_notification',
): Promise<void> => {
  const notificationsToPersist: { userId: string; message: string }[] = [];

  for (const userId of userIds) {
    const isOnline = await socketService.isUserOnline(userId); // Checks if user is connected via WebSocket
    if (isOnline) {
      socketService.emitToUser(userId, event, { message }); // Emits notification via WebSocket
    } else {
      notificationsToPersist.push({ userId, message }); // Prepares for database persistence
    }
  }

  if (notificationsToPersist.length > 0) {
    await prisma.notification.createMany({
      data: notificationsToPersist, // Persists notifications for offline users
    });
  }
};
```
*   This service iterates through the provided `userIds`.
*   For each user, it checks if they are currently online using `socketService.isUserOnline()`.
*   If online, the notification is immediately sent via WebSocket using `socketService.emitToUser()`.
*   If offline, the notification is added to a list to be persisted in the database.
*   Finally, any notifications for offline users are saved to the `Notification` table in the database using `prisma.notification.createMany()`.
*   When an offline user reconnects, all their saved notifications are sent to them and then removed from the database. This ensures that all users receive every notification.

5.  **Response to Client:**
*   **Status:** `200 OK`
*   **Body (JSON):**
```json
{
  "success": true,
  "message": "Notification sent to all users."
}
```
*   **Error Responses:**
*   `400 Bad Request`: If validation fails.
*   `401 Unauthorized`: If no valid JWT is provided.
*   `403 Forbidden`: If the authenticated user is not an admin.
*   `500 Internal Server Error`: For unexpected server-side errors.
