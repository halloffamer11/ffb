# Development Tools

This directory contains development tools, debug scripts, and build utilities.

## Directory Structure

- `debug/` - Debug scripts for development and troubleshooting
- `validation/` - HITL validation scripts
- `scripts/` - Build and utility scripts
- `config/` - Tool configurations (Playwright, MCP, etc.)

## Debug Scripts

```bash
# Debug VBD axis calculations
npm run debug:vbd-axis

# Validate VBD axis fixes
npm run validate:vbd-axis-fix

# Full VBD validation with dev server
npm run validate:vbd
```

## Configuration Files

- `playwright.config.ts` - Playwright test configuration
- `playwright-mcp.config.json` - MCP server configuration for Playwright

These tools are for development use only and are not included in the production build.