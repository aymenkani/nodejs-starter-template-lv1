# Documentation Website Local Setup

This guide will help you set up your local environment to run and contribute to the documentation website.

## Prerequisites

Before you begin, ensure you have the following installed:

-   **Python 3**: MkDocs requires Python. You can download it from [python.org](https://www.python.org/downloads/).
-   **pip**: Python's package installer. It usually comes bundled with Python.

## Installation

1.  **Navigate to the `docs-website` directory**:
    ```bash
    cd docs-website
    ```

2.  **Install MkDocs and its dependencies**:
    It's recommended to use a virtual environment to manage dependencies.

    ```bash
    # (Optional) Create a virtual environment
    python3 -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`

    # Install MkDocs and any themes/plugins specified in mkdocs.yml
    pip install -r requirements.txt
    ```
    *Note: If `requirements.txt` does not exist, you might need to install `mkdocs`, `pymdown-extensions` and `mkdocs-material` manually:*
    ```bash
    pip install mkdocs mkdocs-material pymdown-extensions
    ```

## Running the Documentation Locally

Once installed, you can serve the documentation locally to preview your changes.

1.  **Navigate to the `docs-website` directory** (if you're not already there):
    ```bash
    cd docs-website
    ```

2.  **Start the MkDocs development server**:
    ```bash
    mkdocs serve
    ```

3.  **Access the website**:
    Open your web browser and go to `http://127.0.0.1:8000` (or the address shown in your terminal).

## Contributing

-   Edit the Markdown files in the `docs` directory.
-   The `mkdocs serve` command will automatically rebuild and refresh your browser as you make changes.
-   Refer to the [MkDocs documentation](https://www.mkdocs.org/user-guide/writing-your-docs/) for more details on writing documentation.
