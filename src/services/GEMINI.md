### Guide: Creating New Service

**Services (`src/services/`)**:
    * Contain ALL business logic.
    * Interact with Database (Prisma) or 3rd Party APIs.
    * Throw `ApiError` for failures.
    * For logging Use logger from '../utils/logger'
    * Return plain objects (not HTTP responses).
    * Some services requires config object, make sure to pass it (for example: inside src/services/auth.service.ts : `export const createAuthService = (config: Config) => {..}`) and export it from index.ts (for example: `export const authService = createAuthService(config);`)
    

**Import and initialize config:**
```typescript
import { getConfig } from '../config/config';
const config = getConfig(process.env);
```