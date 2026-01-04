---
description: Refine a rough feature description by examining the codebase and clarifying requirements
---
## Input
This workflow accepts either:
- A **file path** to a rough feature description (e.g., `feature-implementation/new.md`)
- A **direct prompt** from the user describing the feature

---

## Steps

1. **Load Feature Description**:
   - If a file path is provided, read the feature description file.
   - If the user provided the description directly, use that as the input.

2. **Analyze Codebase Context**:
   - Examine relevant parts of the codebase to understand:
     - Existing architecture and patterns
     - Related components or services
     - Available APIs and utilities
     - Tech stack constraints (see `GEMINI.md`)

3. **Identify Ambiguities**:
   - List any unclear or underspecified aspects of the feature, such as:
     - Edge cases not covered
     - Missing UI/UX details
     - Unclear data flow or state management
     - Performance or scalability considerations
     - API contract ambiguities

4. **Ask Clarifying Questions**:
   - Present the user with a numbered list of questions for any ambiguities found.
   - Wait for user responses before proceeding.

5. **Refine Feature Description**:
   - Incorporate user answers and codebase insights into a refined feature spec.
   - The refined spec should include:
     - **Goal**: Clear objective of the feature
     - **Context**: Relevant existing code/components
     - **Requirements**: Detailed functional requirements
     - **Technical Considerations**: Implementation notes, constraints
     - **Acceptance Criteria**: How to verify the feature works

6. **Save Refined Feature**:
   - If a feature file exists, update it in place with the refined content.
   - Rename the file to a descriptive name based on the feature (e.g., `video-file-picker.md`).
   - If no file exists, create a new file in `feature-implementation/` with a descriptive name.

7. **Report to User**:
   - Summarize the refined feature description.
   - Ask for final approval or additional refinements.
