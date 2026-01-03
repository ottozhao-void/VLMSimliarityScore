---
description: Analyze project files for modularity compliance and document violations
---
1. Read the modularity rules from `GEMINI.md` or user global rules to understand the compliance criteria:
   - **Backend (Python)**:
     - API Layer (`app/api/`): Should ONLY handle HTTP requests, input validation (Pydantic), and response formatting. NO business logic or model inference code.
     - Service Layer (`app/services/`): Should encapsulate VLM logic, tensor operations, and preprocessing. Must be HTTP-framework-agnostic.
   - **Frontend (TypeScript/React)**:
     - `.tsx` files: Should focus on UI rendering and layout only. Keep components presentational.
     - `.ts` files: Should contain state management, API integration, and business rules in Custom Hooks or utilities.

2. Iterate through backend Python files in `app/api/`:
   - Check for any direct model inference, tensor operations, or business logic.
   - Flag violations where controller code contains algorithm/service-level logic.

3. Iterate through backend Python files in `app/services/`:
   - Check for any HTTP-specific code (e.g., FastAPI dependencies, Request/Response objects).
   - Flag violations where service code is coupled to the HTTP layer.

4. Iterate through frontend `.tsx` files in `src/components/`:
   - Check for complex state management, API calls, or business logic that should be in hooks.
   - Flag violations where view components contain logic that belongs in `.ts` hooks.

5. Iterate through frontend `.ts` files in `src/hooks/`:
   - Ensure hooks properly encapsulate logic and don't leak UI concerns.

6. Create or update `to_refactor.md` in the project root with the following format:
   ```markdown
   # Refactoring Report
   
   Generated: [TIMESTAMP]
   
   ## Summary
   - Total files analyzed: [COUNT]
   - Files with violations: [COUNT]
   
   ## Violations by Category
   
   ### Backend API Layer Violations
   - `[file path]`: [Description of violation]
   
   ### Backend Service Layer Violations
   - `[file path]`: [Description of violation]
   
   ### Frontend View Layer Violations
   - `[file path]`: [Description of violation]
   
   ### Frontend Logic Layer Violations
   - `[file path]`: [Description of violation]
   
   ## Recommendations
   [Specific refactoring suggestions for each violation]
   ```

7. Report the findings to the user with a summary of violations found.
