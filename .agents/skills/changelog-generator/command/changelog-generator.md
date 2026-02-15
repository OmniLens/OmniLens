---
description: Load Changelog Generator skill for automated changelog generation with semantic versioning. Use when users ask to "update changelog", "bump version", "create release", "generate changelog", or need to follow semantic versioning and Keep a Changelog standards.
---

Load the Changelog Generator skill and help with automated changelog generation, version bumping, and release preparation following semantic versioning and Keep a Changelog standards.

## Workflow

### Step 1: Load changelog-generator skill

```
skill({ name: 'changelog-generator' })
```

### Step 2: Review all staged changes

**Objective:** Understand what changes have been staged and categorize them.

**Actions:**
1. Check git status:
   ```bash
   git status
   ```

2. Review staged changes:
   ```bash
   git diff --cached
   ```

3. Analyze changes to identify:
   - Breaking changes (API changes, removed features, incompatible changes)
   - New features (added functionality, new APIs, new components)
   - Bug fixes (fixes to existing functionality)
   - Documentation (README updates, doc changes)
   - Refactoring (code improvements without behavior changes)

4. Review commit messages if available:
   ```bash
   git log --oneline --cached
   ```

**Categorization:**
- Breaking changes → MAJOR version bump
- New features → MINOR version bump
- Bug fixes → PATCH version bump
- Documentation only → Usually no version bump (or PATCH if significant)
- Refactoring → Usually PATCH version bump

### Step 3: Determine the appropriate version bump

**Objective:** Calculate the new version number based on semantic versioning rules.

**Actions:**
1. Read current version from `@package.json`:
   ```bash
   cat package.json | grep '"version"'
   ```

2. Apply semantic versioning rules:
   - **MAJOR (X.0.0)**: Breaking changes
   - **MINOR (0.X.0)**: New features (backward compatible)
   - **PATCH (0.0.X)**: Bug fixes (backward compatible)

3. **Priority order**: If multiple change types exist, use the highest:
   - MAJOR > MINOR > PATCH
   - If any breaking changes exist → MAJOR
   - Else if any new features exist → MINOR
   - Else → PATCH

**Decision Tree:**
```
Are there breaking changes?
├─ Yes → MAJOR version bump (X.0.0)
└─ No → Are there new features?
    ├─ Yes → MINOR version bump (0.X.0)
    └─ No → PATCH version bump (0.0.X)
```

### Step 4: Update @package.json version accordingly

**Objective:** Update the version field in root `@package.json` file.

**Actions:**
1. Read the current `@package.json` file
2. Locate the `"version"` field (usually near the top)
3. Update the version number to the new version determined in Step 3
4. **Preserve all formatting:**
   - Keep the same indentation (spaces or tabs)
   - Maintain the same JSON structure
   - Don't modify other fields
   - Don't reorder fields
   - Keep trailing commas if they exist

**Important:**
- Only update the `version` field
- Don't change any other content
- Maintain JSON validity
- Preserve file formatting and style

### Step 5: Update @CHANGELOG.md with a new version block

**Objective:** Add a new version section to `@CHANGELOG.md` following Keep a Changelog format.

**Actions:**
1. Read the current `@CHANGELOG.md` file
2. Locate the `## [Unreleased]` section (should be at the top)
3. Insert a new version block **after** `## [Unreleased]` and **before** the previous version
4. Use the format: `## [X.Y.Z] - YYYY-MM-DD`
   - `X.Y.Z` is the new version number
   - `YYYY-MM-DD` is the current date (see Step 6)

**Important:**
- Place new version block between `[Unreleased]` and the previous release
- Use exact format: `## [X.Y.Z] - YYYY-MM-DD`
- Maintain consistent spacing with existing entries
- Don't modify existing version entries

### Step 6: Add the version and the date

**Objective:** Ensure the version block has the correct version number and current date.

**Actions:**
1. Get the current date in YYYY-MM-DD format
   - Use system date/time information
   - Never assume or hardcode dates
   - Format: `YYYY-MM-DD` (e.g., `2026-01-25`)

2. Verify the version number matches Step 3 and Step 4
   - Version in changelog header must match `@package.json` version
   - Format: `[X.Y.Z]` where X, Y, Z are numbers

3. Update the version block header:
   ```markdown
   ## [X.Y.Z] - YYYY-MM-DD
   ```

**Date Format Rules:**
- Always use `YYYY-MM-DD` format
- Use 4-digit year
- Use 2-digit month (01-12)
- Use 2-digit day (01-31)
- Match the format of existing changelog entries

### Step 7: Add the changelog data

**Objective:** Populate the version block with categorized change entries.

**Actions:**
1. Organize changes from Step 2 into appropriate sections
2. Use the standard Keep a Changelog sections:
   - `### Added` - New features
   - `### Changed` - Changes in existing functionality
   - `### Deprecated` - Soon-to-be removed features
   - `### Removed` - Removed features
   - `### Fixed` - Bug fixes
   - `### Security` - Security vulnerabilities

3. Format each entry:
   - Use bullet points with `- ` prefix
   - Start with a capital letter
   - End without a period (unless it's a full sentence)
   - Be concise and descriptive
   - Focus on user-facing changes

4. **Section Guidelines:**
   - **Added**: New features, new APIs, new components, new capabilities
   - **Changed**: Modified behavior, API changes (non-breaking), improvements
   - **Deprecated**: Features marked for removal in future versions
   - **Removed**: Features that were removed (usually indicates MAJOR bump)
   - **Fixed**: Bug fixes, corrections, patches
   - **Security**: Security-related fixes and improvements

5. Only include sections that have changes
6. Order sections: Added, Changed, Deprecated, Removed, Fixed, Security

**Writing Guidelines:**
- Write from the user's perspective
- Use present tense ("Adds feature" not "Added feature")
- Be specific but concise
- Group related changes together
- Avoid technical jargon when possible
- Focus on what changed, not how it was implemented
- **User-facing only:** Do not mention component names, file paths, API endpoints, or internal utilities. Describe outcomes and benefits, not implementation details.
- **User-facing only:** Do not mention component names, file paths, API endpoints, or internal utilities. Describe outcomes and benefits, not implementation details.

### Step 8: One final review

**Objective:** Verify everything is correct and consistent before completion.

**Checklist:**

1. **Version Consistency:**
   - [ ] Version in `@package.json` matches version in `@CHANGELOG.md` header
   - [ ] Version format is correct (X.Y.Z where X, Y, Z are numbers)

2. **Date Format:**
   - [ ] Date is in YYYY-MM-DD format
   - [ ] Date matches current date (not future or past)
   - [ ] Date format matches existing changelog entries

3. **Changelog Content:**
   - [ ] All staged changes are represented in the changelog
   - [ ] Changes are in the correct sections
   - [ ] No duplicate entries
   - [ ] Entries are clear and descriptive

4. **Formatting:**
   - [ ] Markdown formatting is correct
   - [ ] Version block is in the correct location (after `[Unreleased]`)
   - [ ] Proper spacing between sections
   - [ ] Consistent with existing changelog style

5. **Semantic Versioning:**
   - [ ] Version bump type matches change types (MAJOR/MINOR/PATCH)
   - [ ] Breaking changes → MAJOR bump
   - [ ] New features → MINOR bump
   - [ ] Bug fixes → PATCH bump

6. **File Integrity:**
   - [ ] `@package.json` is valid JSON
   - [ ] `@CHANGELOG.md` is valid markdown
   - [ ] No syntax errors
   - [ ] Files are properly formatted

**If any issues are found:**
- Fix them before completing
- Re-verify the checklist
- Ensure consistency across all files

## Summary

```
=== Changelog Generation Complete ===

Version: <X.Y.Z>
Version Bump Type: <MAJOR|MINOR|PATCH>
Date: <YYYY-MM-DD>

Files Updated:
- @package.json (version: <X.Y.Z>)
- @CHANGELOG.md (new version block added)

Changes Categorized:
- Added: <count>
- Changed: <count>
- Fixed: <count>
- Other: <count>

<brief summary of what was done>
```
