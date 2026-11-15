# Generate a Food Grandma specification draft

Run this prompt from the companion repository root. Read only the input files named below for product requirements. Do not edit the curated `specs/` directory.

## Feature

`01-restaurant-auth`

## Input files

- `specs-draft/01-restaurant-auth/feature-brief.md`
- `specs-draft/01-restaurant-auth/product-evidence.md`

## Task

Create a Markdown specification draft at:

`specs-generated/01-restaurant-auth.md`

Use Traditional Chinese (Taiwan). Organize the document with these sections:

1. Title and draft status
2. Purpose and scope
3. Role and preconditions
4. Business rules with stable rule IDs
5. Review status, initially pending human review
6. Acceptance scenarios with test case IDs, Given, When, Then, and verification method
7. Test data and technical clues
8. Open questions and evidence limitations
9. Sources

Create exactly two acceptance scenarios from the provided requirements: one positive case where a driver with two active deliveries accepts a third, and one negative case where a driver with three active deliveries attempts to accept a fourth. Preserve the stated expected UI result and data invariants. Do not add other cases or invent additional business rules.

## Constraints

- Treat `feature-brief.md` as the author's proposed product behavior, not as an approved specification. Mark the generated document as an AI-produced draft pending human review. Leave all review choices unchecked.
- Treat `product-evidence.md` as unverified implementation/UI clues. Clearly distinguish these clues from desired behavior.
- Do not read or copy `specs/01-restaurant-auth.md`; it is a separate curated example and may contain earlier decisions. Do not modify any file under `specs/`.
- Do not invent API responses, HTTP status codes, database fields, locators, test results, approvals, or sources. Mark unverified details as pending verification.
- Keep the output limited to the specified path. Do not create tests or change application code.
- If the input sources conflict or leave an expected result unclear, preserve both statements and add a review question instead of resolving the conflict yourself.

After writing the file, report its path and list any unresolved questions. Do not move or copy it into `specs/`; promotion requires human review.
