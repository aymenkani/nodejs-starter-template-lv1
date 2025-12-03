# Authentication Routes Documentation

This section provides a detailed breakdown of the authentication API routes, outlining their purpose, the flow of requests through middleware, controllers, and services, and the expected responses. These routes handle user registration, login, logout, password reset, and Google OAuth integration.

---

## 1. Register User

**Endpoint:** `POST /v1/auth/register`
**Description:** Registers a new user with an email, username, and password.

### Flow Map

1.  **Initial Request:**
*   **Method:** `POST`
*   **Path:** `/v1/auth/register`
*   **Client Sends:**
*   **Request Body (JSON):**
```json
{
  "username": "johndoe",
  "email": "john.doe@example.com",
  "password": "password123"
}
```

2.  **Route Handler (`src/api/auth.routes.ts`):**
```typescript
router.post('/register', validate(authValidation.register), authController.register);
```
*   The request first passes through the `validate(authValidation.register)` middleware. This middleware uses the Zod schema defined in `authValidation.register` to ensure the request body contains valid `username`, `email`, and `password`.
*   If validation passes, the request is forwarded to `authController.register`.

3.  **Controller (`src/controllers/auth.controller.ts`):**
```typescript
const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.registerUser(req.body);
    const tokens = await tokenService.generateAuthTokens(user);
    res.cookie('refreshToken', tokens.refresh.token, {
      httpOnly: true,
      expires: tokens.refresh.expires,
    });
    const { password: _password, passwordHistory: _passwordHistory, ...userWithoutPassword } = user;
    res.status(201).send({ user: userWithoutPassword, access: tokens.access });
  } catch (error) {
    next(error);
  }
};
```
*   The controller extracts the user data from `req.body`.
*   It calls `authService.registerUser()` to create the new user.
*   Upon successful user creation, it calls `tokenService.generateAuthTokens()` to create JWT access and refresh tokens.
*   The refresh token is set as an HTTP-only cookie.
*   The user object (excluding sensitive fields like `password` and `passwordHistory`) and the access token are sent in the response.
*   Any errors are caught and passed to the Express error handling middleware.

4.  **Service (`src/services/auth.service.ts` and `src/services/user.service.ts`):**
*   `authService.registerUser(userData)`:
```typescript
const registerUser = async (userData: RegisterUserBody): Promise<User> => {
  if (await userService.getUserByEmail(userData.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  if (await userService.getUserByUsername(userData.username)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Username already taken');
  }
  const user = await userService.createUser(userData);
  return user;
};
```
*   Checks if an account with the provided email already exists using `userService.getUserByEmail()`. If so, throws a `400 Bad Request` error.
*   Checks if an account with the provided username already exists using `userService.getUserByUsername()`. If so, throws a `400 Bad Request` error.
*   If both are unique, it calls `userService.createUser()` to persist the user.
*   `userService.createUser(userData)`:
```typescript
const createUser = async (userData: CreateUserBody): Promise<User> => {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  return prisma.user.create({
    data: {
      ...userData,
      password: hashedPassword,
      passwordHistory: [hashedPassword], // Add initial password to history
    },
  });
};
```
*   Hashes the user's password using `bcryptjs`.
*   Creates the user record in the database using `prisma.user.create()`, storing the hashed password and initializing `passwordHistory`.
*   Returns the newly created `User` object.
*   `tokenService.generateAuthTokens(user)`: (Detailed in `docs/authentication.md`) Generates and saves JWT access and refresh tokens.

5.  **Response to Client:**
*   **Status:** `201 Created`
*   **Body (JSON):**
```json
{
  "user": {
    "id": "uuid-of-new-user",
    "username": "johndoe",
    "email": "john.doe@example.com",
    "role": "USER",
    "googleId": null,
    "provider": "LOCAL",
    "createdAt": "2023-01-01T12:00:00.000Z",
    "updatedAt": "2023-01-01T12:00:00.000Z"
  },
  "access": {
    "token": "jwt-access-token",
    "expires": "2023-01-01T12:30:00.000Z"
  }
}
```
*   **Cookie:** `refreshToken=jwt-refresh-token; HttpOnly; Expires=...`
*   **Error Responses:**
*   `400 Bad Request`: If validation fails, email/username is already taken.
*   `500 Internal Server Error`: For unexpected server-side errors.

---

## 2. Login User

**Endpoint:** `POST /v1/auth/login`
**Description:** Authenticates a user with their email and password, returning JWT access and refresh tokens.

### Flow Map

1.  **Initial Request:**
*   **Method:** `POST`
*   **Path:** `/v1/auth/login`
*   **Client Sends:**
*   **Request Body (JSON):**
```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

2.  **Route Handler (`src/api/auth.routes.ts`):**
```typescript
router.post('/login', validate(authValidation.login), authController.login);
```
*   The request first passes through the `validate(authValidation.login)` middleware, ensuring the request body contains valid `email` and `password`.
*   If validation passes, the request is forwarded to `authController.login`.

3.  **Controller (`src/controllers/auth.controller.ts`):**
```typescript
const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const user = await authService.loginUserWithEmailAndPassword(email, password);
    const tokens = await tokenService.generateAuthTokens(user);
    res.cookie('refreshToken', tokens.refresh.token, {
      httpOnly: true,
      expires: tokens.refresh.expires,
    });
    const { password: _password, passwordHistory: _passwordHistory, ...userWithoutPassword } = user;
    res.send({ user: userWithoutPassword, access: tokens.access });
  } catch (error) {
    next(error);
  }
};
```
*   The controller extracts `email` and `password` from `req.body`.
*   It calls `authService.loginUserWithEmailAndPassword()` to verify credentials.
*   Upon successful login, it calls `tokenService.generateAuthTokens()` to create JWT access and refresh tokens.
*   The refresh token is set as an HTTP-only cookie.
*   The user object (excluding sensitive fields) and the access token are sent in the response.
*   Any errors are caught and passed to the Express error handling middleware.

4.  **Service (`src/services/auth.service.ts` and `src/services/user.service.ts`):**
*   `authService.loginUserWithEmailAndPassword(email, password)`:
```typescript
const loginUserWithEmailAndPassword = async (email: string, password: string): Promise<User> => {
  const user = await userService.getUserByEmail(email);

  if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }

  // Update password history on successful login
  const passwordHistoryLimit = 5;
  const updatedPasswordHistory = [user.password, ...user.passwordHistory].slice(
    0,
    passwordHistoryLimit,
  );

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHistory: updatedPasswordHistory,
    },
  });

  return user;
};
```
*   Retrieves the user by email using `userService.getUserByEmail()`.
*   Compares the provided password with the stored hashed password using `bcrypt.compare()`.
*   If user not found or password incorrect, throws a `401 Unauthorized` error.
*   Updates the user's `passwordHistory` in the database with the current hashed password (if successful login).
*   Returns the authenticated `User` object.
*   `tokenService.generateAuthTokens(user)`: (Detailed in `docs/authentication.md`) Generates and saves JWT access and refresh tokens.

5.  **Response to Client:**
*   **Status:** `200 OK`
*   **Body (JSON):**
```json
{
  "user": {
    "id": "uuid-of-user",
    "username": "johndoe",
    "email": "john.doe@example.com",
    "role": "USER",
    "googleId": null,
    "provider": "LOCAL",
    "createdAt": "2023-01-01T12:00:00.000Z",
    "updatedAt": "2023-01-01T12:00:00.000Z"
  },
  "access": {
    "token": "jwt-access-token",
    "expires": "2023-01-01T12:30:00.000Z"
  }
}
```
*   **Cookie:** `refreshToken=jwt-refresh-token; HttpOnly; Expires=...`
*   **Error Responses:**
*   `400 Bad Request`: If validation fails.
*   `401 Unauthorized`: If email/password is incorrect.
*   `500 Internal Server Error`: For unexpected server-side errors.

---

## 3. Logout User

**Endpoint:** `POST /v1/auth/logout`
**Description:** Logs out the current user by invalidating their refresh token and blacklisting their access token to prevent its reuse. For a detailed explanation of the token blacklisting and cleanup process, please see the main [Authentication](./../authentication.md) documentation.

### Flow Map

1.  **Initial Request:**
*   **Method:** `POST`
*   **Path:** `/v1/auth/logout`
*   **Client Sends:**
*   Valid JWT access token in the `Authorization` header.
*   Refresh token in an HTTP-only cookie.
*   No request body.

2.  **Route Handler (`src/api/auth.routes.ts`):**
```typescript
router.post('/logout', auth, validate(authValidation.logout), authController.logout);
```
*   The request first passes through the `auth` middleware, which authenticates the user using the access token.
*   Then, `validate(authValidation.logout)` middleware ensures any required parameters for logout (though none are explicitly defined in the validation schema for this route, it's good practice to include it for future expansion).
*   If validation passes, the request is forwarded to `authController.logout`.

3.  **Controller (`src/controllers/auth.controller.ts`):**
```typescript
const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;
    const accessToken = req.headers.authorization?.split(' ')[1] || '';
    await authService.logout(refreshToken, accessToken);
    res.clearCookie('refreshToken');
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
```
*   The controller extracts the `refreshToken` from `req.cookies`.
*   It extracts the `accessToken` from the `Authorization` header.
*   It calls `authService.logout()` with both tokens.
*   Upon successful logout, it clears the `refreshToken` cookie.
*   Sends a `204 No Content` response.
*   Any errors are caught and passed to the Express error handling middleware.

4.  **Service (`src/services/auth.service.ts` and `src/services/token.service.ts`):**
*   `authService.logout(refreshToken, accessToken)`:
```typescript
const logout = async (refreshToken: string, accessToken?: string): Promise<void> => {
  if (!refreshToken) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No refresh token provided');
  }

  const refreshTokenDoc = await prisma.refreshToken.findFirst({
    where: {
      token: refreshToken,
    },
  });
  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Not found');
  }
  await prisma.refreshToken.delete({ where: { id: refreshTokenDoc.id } });

  if (accessToken) {
    try {
      const decodedToken = jwt.decode(accessToken) as { exp: number };
      if (decodedToken && decodedToken.exp) {
        await prisma.blacklistedToken.create({
          data: {
            token: accessToken,
            expires: new Date(decodedToken.exp * 1000),
          },
        });
      }
    } catch (error) {
      console.error('Error blacklisting access token:', error);
    }
  }
};
```
*   Checks if a `refreshToken` is provided.
*   Finds the `refreshTokenDoc` in the database. If not found, throws a `404 Not Found` error.
*   Deletes the `refreshTokenDoc` from the database, invalidating the refresh token.
*   If an `accessToken` is provided, it decodes it to get its expiration time and then blacklists it in the `BlacklistedToken` Prisma model, preventing its further use.

5.  **Response to Client:**
*   **Status:** `204 No Content`
*   **Body:** Empty
*   **Error Responses:**
*   `400 Bad Request`: If no refresh token is provided.
*   `401 Unauthorized`: If access token is invalid (handled by `auth` middleware).
*   `404 Not Found`: If the refresh token is not found in the database.
*   `500 Internal Server Error`: For unexpected server-side errors.

---

## 4. Request Password Reset

**Endpoint:** `POST /v1/auth/request-password-reset`
**Description:** Initiates the password reset process by sending a password reset email to the user.

### Flow Map

1.  **Initial Request:**
*   **Method:** `POST`
*   **Path:** `/v1/auth/request-password-reset`
*   **Client Sends:**
*   **Request Body (JSON):**
```json
{
  "email": "john.doe@example.com"
}
```

2.  **Route Handler (`src/api/auth.routes.ts`):**
```typescript
router.post(
  '/request-password-reset',
  authLimiter, // Apply the rate limiter
  validate(authValidation.requestPasswordReset),
  authController.requestPasswordReset,
);
```
*   The request first passes through the `authLimiter` middleware, which limits the number of requests to this endpoint to prevent abuse.
*   Then, `validate(authValidation.requestPasswordReset)` middleware ensures the request body contains a valid `email`.
*   If validation passes, the request is forwarded to `authController.requestPasswordReset`.

3.  **Controller (`src/controllers/auth.controller.ts`):**
```typescript
const requestPasswordReset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    await authService.generatePasswordResetToken(email);
    res.status(200).send({ message: 'Password reset email sent successfully.' });
  } catch (error) {
    next(error);
  }
};
```
*   The controller extracts the `email` from `req.body`.
*   It calls `authService.generatePasswordResetToken()` to handle the token generation and email sending.
*   Sends a `200 OK` response with a success message.
*   Any errors are caught and passed to the Express error handling middleware.

4.  **Service (`src/services/auth.service.ts` and `src/services/email.service.ts`):**
*   `authService.generatePasswordResetToken(email)`:
```typescript
const generatePasswordResetToken = async (email: string): Promise<void> => {
  const user = await userService.getUserByEmail(email);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const jwtResetToken = jwt.sign({ sub: user.id }, config.jwt.resetPasswordSecret, {
    expiresIn: `${config.jwt.resetPasswordExpirationMinutes}m`,
  });

  const hashedJwtResetToken = await bcrypt.hash(jwtResetToken, 10); // Hash the JWT
  const opaqueResetToken = uuidv4(); // Generate an opaque token (UUID)

  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + config.jwt.resetPasswordExpirationMinutes);

  await prisma.passwordResetToken.create({
    data: {
      token: hashedJwtResetToken, // Store the hashed JWT
      opaqueToken: opaqueResetToken, // Store the opaque token
      userId: user.id,
      expires: expires,
    },
  });

  await emailService.sendResetPasswordEmail(user.email, opaqueResetToken, config.clientUrl); // Send opaque token in email
};
```
*   Retrieves the user by email using `userService.getUserByEmail()`. If not found, throws a `404 Not Found` error.
*   Generates a JWT (`jwtResetToken`) containing the user ID, signed with a specific reset password secret and expiration.
*   Hashes this JWT (`hashedJwtResetToken`) for storage in the database.
*   Generates an opaque UUID (`opaqueResetToken`) which is the token actually sent to the user in the email. This opaque token is used to look up the hashed JWT in the database.
*   Calculates the expiration date for the reset token.
*   Creates a `PasswordResetToken` record in the database, storing the hashed JWT, the opaque token, user ID, and expiration.
*   Calls `emailService.sendResetPasswordEmail()` to send the email containing the `opaqueResetToken` to the user.

5.  **Response to Client:**
*   **Status:** `200 OK`
*   **Body (JSON):**
```json
{
  "message": "Password reset email sent successfully."
}
```
*   **Error Responses:**
*   `400 Bad Request`: If validation fails.
*   `404 Not Found`: If the email does not belong to a registered user.
*   `429 Too Many Requests`: If rate limit is exceeded.
*   `500 Internal Server Error`: For unexpected server-side errors (e.g., email sending failure).

---

## 5. Reset Password

**Endpoint:** `POST /v1/auth/reset-password`
**Description:** Resets the user's password using a valid password reset token.

### Flow Map

1.  **Initial Request:**
*   **Method:** `POST`
*   **Path:** `/v1/auth/reset-password`
*   **Client Sends:**
*   **Request Body (JSON):**
```json
{
  "token": "opaque-reset-token-from-email",
  "password": "new_strong_password"
}
```

2.  **Route Handler (`src/api/auth.routes.ts`):**
```typescript
router.post(
  '/reset-password',
  validate(authValidation.resetPassword),
  authController.resetPassword,
);
```
*   The request first passes through the `validate(authValidation.resetPassword)` middleware, ensuring the request body contains a valid `token` and `password`.
*   If validation passes, the request is forwarded to `authController.resetPassword`.

3.  **Controller (`src/controllers/auth.controller.ts`):**
```typescript
const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    res.status(200).send({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};
```
*   The controller extracts `token` and `password` from `req.body`.
*   It calls `authService.resetPassword()` to validate the token and update the password.
*   Sends a `200 OK` response with a success message.
*   Any errors are caught and passed to the Express error handling middleware.

4.  **Service (`src/services/auth.service.ts` and `src/services/user.service.ts`):**
*   `authService.resetPassword(opaqueResetToken, newPassword)`:
```typescript
const resetPassword = async (opaqueResetToken: string, newPassword: string): Promise<void> => {
  try {
    const passwordResetTokenDoc = await prisma.passwordResetToken.findUnique({
      where: { opaqueToken: opaqueResetToken },
    });

    if (!passwordResetTokenDoc || passwordResetTokenDoc.expires < new Date()) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired password reset token');
    }

    const user = await userService.getUserById(passwordResetTokenDoc.userId);

    if (!user) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'User not found for this reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Check against password history
    const passwordHistoryLimit = 5;
    for (const oldHashedPassword of user.passwordHistory) {
      if (await bcrypt.compare(newPassword, oldHashedPassword)) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'New password cannot be one of the recently used passwords',
        );
      }
    }

    // Update password and history
    const updatedPasswordHistory = [hashedPassword, ...user.passwordHistory].slice(
      0,
      passwordHistoryLimit,
    );

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordHistory: updatedPasswordHistory,
      },
    });

    // Invalidate all refresh tokens for the user to force logout from all devices
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });

    // Invalidate the reset token after use
    await prisma.passwordResetToken.delete({
      where: { id: passwordResetTokenDoc.id },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired password reset token');
  }
};
```
*   Finds the `passwordResetTokenDoc` in the database using the `opaqueResetToken`.
*   Validates the token's existence and expiration. If invalid/expired, throws a `400 Bad Request` error.
*   Retrieves the associated user using `userService.getUserById()`.
*   Hashes the `newPassword`.
*   Performs a password history check to prevent reuse of recent passwords.
*   Updates the user's password and `passwordHistory` in the database.
*   **Crucially**, it invalidates all existing refresh tokens for the user (`prisma.refreshToken.deleteMany()`) to force logout from all devices, enhancing security.
*   Deletes the used `passwordResetTokenDoc` from the database.

5.  **Response to Client:**
*   **Status:** `200 OK`
*   **Body (JSON):**
```json
{
  "message": "Password reset successfully"
}
```
*   **Error Responses:**
*   `400 Bad Request`: If validation fails, token is invalid/expired, or new password is in history.
*   `500 Internal Server Error`: For unexpected server-side errors.

---

## 6. Google OAuth Initiation

**Endpoint:** `GET /v1/auth/google`
**Description:** Redirects the user to Google's authentication server to initiate the OAuth2.0 flow.

### Flow Map

1.  **Initial Request:**
*   **Method:** `GET`
*   **Path:** `/v1/auth/google`
*   **Client Sends:** No request body or parameters.

2.  **Route Handler (`src/api/auth.routes.ts`):**
```typescript
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
```
*   The request is directly handled by `passport.authenticate('google')`.
*   Passport.js redirects the user's browser to Google's authentication server, requesting access to their `profile` and `email`.

3.  **Response to Client:**
*   **Status:** `302 Found` (Redirect)
*   **Location Header:** Google's authentication URL.
*   The user's browser is redirected to Google for authentication and consent.

---

## 7. Google OAuth Callback

**Endpoint:** `GET /v1/auth/google/callback`
**Description:** Handles the callback from Google after the user has authenticated and granted permissions.

### Flow Map

1.  **Initial Request (from Google):**
*   **Method:** `GET`
*   **Path:** `/v1/auth/google/callback`
*   **Client Sends:** Google redirects the user's browser to this URL, including an authorization code as a query parameter.

2.  **Route Handler (`src/api/auth.routes.ts`):**
```typescript
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  authController.googleCallback,
);
```
*   The request is handled by `passport.authenticate('google', { session: false, failureRedirect: '/login' })`.
*   Passport.js exchanges the authorization code for Google tokens, fetches the user's Google profile, and then calls the `verify` callback defined in `src/config/passport.config.ts`.
*   If authentication with Google fails, the user is redirected to `/login`.
*   If successful, `req.user` is populated with the user object returned by the Passport strategy's `verify` callback, and the request is forwarded to `authController.googleCallback`.

3.  **Controller (`src/controllers/auth.controller.ts`):**
```typescript
const googleCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).send({ message: 'Authentication failed' });
    }
    const authenticatedUser = req.user as User;
    const user = await userService.getUserById(authenticatedUser.id);
    if (!user) {
      return res.status(401).send({ message: 'Authentication failed' });
    }
    const tokens = await tokenService.generateAuthTokens(user);
    res.cookie('refreshToken', tokens.refresh.token, {
      httpOnly: true,
      expires: tokens.refresh.expires,
    });
    const { password: _password, passwordHistory: _passwordHistory, ...userWithoutPassword } = user;
    res.send({ user: userWithoutPassword, access: tokens.access });
  } catch (error) {
    next(error);
  }
};
```
*   The controller checks if `req.user` is populated by Passport. If not, it sends a `401 Unauthorized` response.
*   It retrieves the full user object from the database using `userService.getUserById()` based on the ID provided by the Passport strategy.
*   It calls `tokenService.generateAuthTokens()` to create JWT access and refresh tokens for the user.
*   The refresh token is set as an HTTP-only cookie.
*   The user object (excluding sensitive fields) and the access token are sent in the response.
*   Any errors are caught and passed to the Express error handling middleware.

4.  **Service (`src/services/user.service.ts` and `src/services/token.service.ts`):**
*   `userService.getUserById(authenticatedUser.id)`: Retrieves the user from the database.
*   `tokenService.generateAuthTokens(user)`: (Detailed in `docs/authentication.md`) Generates and saves JWT access and refresh tokens.

5.  **Response to Client:**
*   **Status:** `200 OK`
*   **Body (JSON):**
```json
{
  "user": {
    "id": "uuid-of-user",
    "username": "googleuser",
    "email": "google.user@gmail.com",
    "role": "USER",
    "googleId": "google-id-string",
    "provider": "GOOGLE",
    "createdAt": "2023-01-01T12:00:00.000Z",
    "updatedAt": "2023-01-01T12:00:00.000Z"
  },
  "access": {
    "token": "jwt-access-token",
    "expires": "2023-01-01T12:30:00.000Z"
  }
}
```
*   **Cookie:** `refreshToken=jwt-refresh-token; HttpOnly; Expires=...`
*   **Error Responses:**
*   `401 Unauthorized`: If authentication fails or user not found.
*   `500 Internal Server Error`: For unexpected server-side errors.

---

## 8. Verify Password Reset Token Validity

**Endpoint:** `GET /v1/auth/verify-reset-token`
**Description:** Checks if a given password reset token is valid and not expired.

### Flow Map

1.  **Initial Request:**
*   **Method:** `GET`
*   **Path:** `/v1/auth/verify-reset-token?token=opaque-reset-token`
*   **Client Sends:**
*   **Query Parameter:** `token` (the opaque reset token received via email).

2.  **Route Handler (`src/api/auth.routes.ts`):**
```typescript
router.get(
  '/verify-reset-token',
  validate(authValidation.verifyResetToken),
  authController.checkResetTokenValidity,
);
```
*   The request first passes through the `validate(authValidation.verifyResetToken)` middleware, ensuring the `token` query parameter is present and valid.
*   If validation passes, the request is forwarded to `authController.checkResetTokenValidity`.

3.  **Controller (`src/controllers/auth.controller.ts`):**
```typescript
const checkResetTokenValidity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.query;
    if (typeof token !== 'string') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Token is required and must be a string');
    }
    await authService.verifyResetToken(token);
    res.status(200).send({ message: 'Password reset token is valid.', success: true });
  } catch (error) {
    next(error);
  }
};
```
*   The controller extracts the `token` from `req.query`.
*   It performs a basic type check for the token.
*   It calls `authService.verifyResetToken()` to check the token's validity.
*   Sends a `200 OK` response with a success message if the token is valid.
*   Any errors are caught and passed to the Express error handling middleware.

4.  **Service (`src/services/auth.service.ts`):**
*   `authService.verifyResetToken(opaqueResetToken)`:
```typescript
const verifyResetToken = async (opaqueResetToken: string): Promise<void> => {
  const passwordResetTokenDoc = await prisma.passwordResetToken.findUnique({
    where: { opaqueToken: opaqueResetToken },
  });

  if (!passwordResetTokenDoc || passwordResetTokenDoc.expires < new Date()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired password reset token');
  }
};
```
*   Finds the `passwordResetTokenDoc` in the database using the `opaqueResetToken`.
*   Checks if the token exists and if it has not expired.
*   If the token is invalid or expired, it throws a `400 Bad Request` error.

5.  **Response to Client:**
*   **Status:** `200 OK`
*   **Body (JSON):**
```json
{
  "message": "Password reset token is valid.",
  "success": true
}
```
*   **Error Responses:**
*   `400 Bad Request`: If validation fails or the token is invalid/expired.
*   `500 Internal Server Error`: For unexpected server-side errors.