# AI Agent & Team Development Best Practices

This document outlines the best practices for the AI Agent and human developers to follow when working on this 4-member project. The project is divided into 4 main epics.

## 1. Modular and Isolated Development
*   **Epic Ownership**: Each of the 4 epics should have its own dedicated directory or modules within the `frontend` and `backend` where possible.
*   **Strict Task Scoping**: Do **ONLY** the specific part that is requested. Do not proactively add extra features or make assumptions beyond the stated requirements.
*   **Avoid Shared State Coupling**: When building features for an epic, avoid unnecessary coupling with other epics. Use well-defined interfaces or API endpoints to communicate between different parts of the system.
*   **Small, Incremental Changes**: Break down epic tasks into small, manageable pieces. The AI should focus on implementing one small component or feature at a time before moving to the next.

## 2. Coding Standards & Style Consistency
*   **Strict Formatting**: Always adhere to the established code formatting rules (e.g., Prettier, ESLint, or equivalent). The AI must format all generated code to match the existing project style to prevent "style mismatches" when merging.
*   **Consistent Naming Conventions**: Use consistent naming for variables, functions, components, and files (e.g., `camelCase` for variables, `PascalCase` for React components).
*   **Component Reusability**: Before creating a new UI component or utility function, check if a shared one already exists in common folders. If an epic requires a change to a shared component, ensure it does not break functionality for other epics.

## 3. Integrating with Other Members' Code
*   **Defensive Programming**: When interacting with functions or APIs built by other team members, include proper error handling and fallback mechanisms. 
*   **Do Not Refactor Unrelated Code**: The AI must strictly scope its changes to the files related to the current task. Avoid formatting or refactoring files that belong to another epic unless explicitly requested.
*   **Clear Documentation**: Document complex logic, API signatures, and component props so other team members can easily integrate with your epic's deliverables.

## 4. Testing & Validation
*   Ensure that every small part implemented works in isolation before declaring it ready for integration.
*   If unit tests or integration tests are configured, the AI should write or update tests for any new logic to prevent regressions when other members merge their code.
