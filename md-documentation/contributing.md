# Contributing

We welcome contributions to this Node.js Advanced Starter Template! By following these guidelines, you can help us maintain code quality, consistency, and make the project better for everyone.

## 1. Code Style and Formatting

This project enforces a consistent code style using ESLint and Prettier.

*   **ESLint:** Identifies and reports on patterns found in ECMAScript/JavaScript code, helping to maintain code quality and prevent common errors.
    *   **Configuration:** `eslint.config.mjs`
*   **Prettier:** An opinionated code formatter that ensures a consistent style across the entire codebase.
    *   **Configuration:** `.prettierrc.js` and `.prettierignore`

### Running Linters and Formatters

Before committing your changes, always run the lint and format commands:

```bash
# Run ESLint to check for code quality issues
npm run lint

# Run Prettier to format your code
npm run format
```

Many IDEs (like VS Code) can be configured to automatically format code with Prettier on save and show ESLint warnings/errors.

## 2. Pre-commit Hooks (Husky)

The template uses [Husky](https://typicode.github.io/husky/) to set up Git hooks. This ensures that certain checks (like linting and formatting) are run automatically before you commit your changes.

*   **Location:** `.husky/` directory
*   **`pre-commit` hook:** Configured to run `npm run lint` and `npm run format` before allowing a commit. If any of these commands fail, the commit will be aborted.

This helps catch issues early and ensures that only properly formatted and linted code makes it into the repository.

> **Note:** Husky's setup script (`npm run prepare`) runs automatically after `npm install` to enable these hooks.

## 3. Commit Message Guidelines

Clear and descriptive commit messages are important for tracking changes, understanding history, and generating changelogs. We recommend following the [Conventional Commits specification](https://www.conventionalcommits.org/en/v1.0.0/).

**Format:**

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Examples:**

*   `feat(auth): add Google OAuth integration`
*   `fix(user): prevent duplicate email registration`
*   `docs(getting-started): update database setup instructions`
*   `chore(deps): update bullmq to latest version`
*   `refactor(middleware): simplify error handling logic`

## 4. Pull Request Process

1.  **Fork the Repository:** Start by forking the project repository to your GitHub account.
2.  **Create a New Branch:** Create a new branch from `main` (or `develop`, depending on the project's branching strategy) for your feature or bug fix.
    ```bash
    git checkout -b feature/my-new-feature
    ```
3.  **Implement Your Changes:** Make your code changes, ensuring they adhere to the code style guidelines.
4.  **Write Tests:** Add appropriate unit and/or integration tests for your changes. Refer to the [Testing guide](./testing.md).
5.  **Run Tests:** Ensure all tests pass locally (`npm run test`).
6.  **Run Linters and Formatters:** Make sure your code is clean (`npm run lint`, `npm run format`).
7.  **Commit Your Changes:** Use clear and concise commit messages following the Conventional Commits specification.
8.  **Push to Your Fork:** Push your new branch to your forked repository.
9.  **Create a Pull Request:** Open a pull request from your branch to the `main` (or `develop`) branch of the original repository.
    *   Provide a clear title and description for your pull request, explaining the changes and their purpose.
    *   Reference any related issues.
10. **Address Feedback:** Be responsive to feedback from maintainers and be prepared to make further changes if requested.

## 5. Reporting Bugs

If you find a bug, please open an issue on the GitHub repository. Provide as much detail as possible, including:

*   A clear and concise description of the bug.
*   Steps to reproduce the behavior.
*   Expected behavior.
*   Screenshots or code snippets if applicable.
*   Your environment details (OS, Node.js version, etc.).

Thank you for contributing to the Node.js Advanced Starter Template! Your efforts help improve this project for the entire community.