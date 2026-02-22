## ADDED Requirements

### Requirement: PRD Document Structured Parsing
The system SHALL accept local PRD documents (Markdown or plain text) and produce a structured requirements representation preserving tables as key-value structures, document hierarchy, and embedded image references.

#### Scenario: Markdown PRD with tables
- **WHEN** the user provides a PRD file containing Markdown tables describing feature requirements
- **THEN** the prd-analyzer agent SHALL output a `structured-requirements.md` that preserves each table row as a structured object with column names as keys, and maintains the document's heading hierarchy as module boundaries

#### Scenario: PRD with embedded images
- **WHEN** the PRD contains embedded images (screenshots, mockups, flowcharts)
- **THEN** the prd-analyzer agent SHALL preserve image references in the structured output and pass them to the logic-generator for visual context during code generation

### Requirement: Intelligent Document Chunking
The system SHALL dynamically determine whether a PRD requires chunking based on document complexity, and if so, split it into semantic chunks suitable for parallel processing.

#### Scenario: Simple PRD single-agent mode
- **WHEN** the PRD document is below the complexity threshold (single page, fewer than 3 feature modules)
- **THEN** the system SHALL process the entire PRD in a single logic-generator agent invocation without chunking

#### Scenario: Complex PRD multi-agent mode
- **WHEN** the PRD document exceeds the complexity threshold (multiple pages, 3+ feature modules, or large table sets)
- **THEN** the system SHALL split the PRD into semantic chunks by module boundary, generate a `chunks.json` mapping, and spawn parallel logic-generator agents for concurrent code generation

### Requirement: Project Context Enhancement
The system SHALL retrieve real API patterns, SDK usage conventions, import paths, and component conventions from the target project codebase before generating logic code, and inject this context into the generation process.

#### Scenario: Existing API pattern reuse
- **WHEN** the target project contains existing API call patterns (fetch wrappers, SDK imports, service layers)
- **THEN** the logic-generator agent SHALL use `codebase-retrieval` to extract these patterns and generate code that follows the same conventions (import paths, function signatures, error handling patterns)

#### Scenario: No existing project context
- **WHEN** no target project is specified or the project has no established patterns
- **THEN** the logic-generator agent SHALL generate logic code using standard framework conventions and clearly mark API calls as placeholders requiring user configuration

### Requirement: Logic Code Generation
The system SHALL generate executable logic code covering user interactions, state management, page routing, and API integration based on the structured PRD requirements and project context.

#### Scenario: Interaction logic generation
- **WHEN** the PRD describes user interaction flows (button clicks, form submissions, navigation)
- **THEN** the logic-generator SHALL produce event handlers, state transitions, and conditional rendering logic that accurately implements the described interactions

#### Scenario: API integration generation
- **WHEN** the PRD references backend data or API operations
- **THEN** the logic-generator SHALL produce API call code using the project's real SDK/fetch patterns (from context retrieval), with correct parameter structures and error handling
