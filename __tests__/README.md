# Test Suite

This directory contains all automated tests for the FFB application.

## Directory Structure

- `e2e/` - End-to-end browser tests
  - `playwright/` - Playwright-based browser automation tests
  - `puppeteer/` - Legacy Puppeteer tests (to be migrated)
- `unit/` - Unit tests for core business logic
- `integration/` - Integration tests for system components
- `visual/` - Visual regression tests
- `fixtures/` - Test data and fixtures
  - `data/` - Test CSV files and sample data
  - `golden/` - Golden datasets for validation

## Running Tests

```bash
# Run all tests
npm test

# Run specific test types
npm run test:e2e
npm run test:unit
npm run test:visual

# Debug tests
npm run test:debug
npm run test:ui
```

## Configuration

Test configuration is located in `__tools__/config/playwright.config.ts`.