## CRITICAL: Implementation Synchronization Requirement

**The Python and TypeScript implementations MUST be kept in sync at all times:**
- Any changes to core functionality in one language must be mirrored in the other
- Test suites must remain parallel - new tests added to one should have equivalents in the other
- API patterns should align (decorators in Python ↔ builder methods in TypeScript)
- Bug fixes applied to one implementation must be checked and applied to the other
- New features must be implemented in both languages simultaneously
- Both implementations maintain ~95% test suite parallelism with matching test classes/suites

This ensures both implementations remain synchronized and users get consistent behavior regardless of which language they choose.
