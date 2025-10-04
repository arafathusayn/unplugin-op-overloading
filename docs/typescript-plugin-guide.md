# TypeScript Language Service Plugin Guide

## Overview

The `typescript-plugin-operator-overloading` enhances your IDE experience by suppressing TypeScript errors for operator overloading in files with the `"use operator overloading"` directive.

## Benefits

✅ **Clean code** - No `@ts-expect-error` comments needed
✅ **Better DX** - Red squiggly lines disappear in your editor
✅ **Auto-detection** - Works automatically on files with the directive
✅ **Type-safe** - Only suppresses operator errors, not other type errors

## Installation

The plugin is included in the monorepo workspace:

```bash
bun install
```

## Configuration

### 1. TypeScript Config

Add the plugin to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "typescript-plugin-operator-overloading"
      }
    ]
  }
}
```

### 2. Editor Setup

**VS Code:**

Create `.vscode/settings.json`:

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

**Important:** Restart the TypeScript server after configuration:
- **Command Palette** (Cmd/Ctrl + Shift + P)
- Type: "TypeScript: Restart TS Server"

**WebStorm / IntelliJ IDEA:**

The plugin is automatically detected from `tsconfig.json`. Restart the IDE if needed.

## Usage Example

```typescript
"use operator overloading"

class Vector {
  constructor(public x: number, public y: number) {}

  [Symbol.for('+')](other: Vector): Vector {
    return new Vector(this.x + other.x, this.y + other.y)
  }
}

const v1 = new Vector(3, 4)
const v2 = new Vector(1, 2)

// No TypeScript errors! ✨
const sum = v1 + v2
```

## Debug Mode

Enable debug logging to see which errors are suppressed:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "typescript-plugin-operator-overloading",
        "debug": true
      }
    ]
  }
}
```

**View logs:**
- VS Code: View → Output → TypeScript
- WebStorm: Help → Show Log

## How It Works

The plugin intercepts TypeScript's `getSemanticDiagnostics` method and filters out these error codes in files with the directive:

- **TS2365**: Operator 'X' cannot be applied to types...
- **TS2362**: The left-hand side of an arithmetic operation must be...
- **TS2363**: The right-hand side of an arithmetic operation must be...
- **TS2460**: Type 'X' has no property 'Y'...

## Important Limitations

⚠️ **IDE Only** - This plugin ONLY affects your editor experience
⚠️ **CLI TypeScript** - Running `tsc` directly will still show errors
⚠️ **Build Tools** - Use `unplugin-op-overloading` for builds (Vite/Webpack)

### Workflow Recommendation

1. **Development**: Use the plugin for clean IDE experience
2. **Building**: Use unplugin (Vite/Webpack) which transforms code
3. **CI/CD**: Use build tools, not `tsc`

### If You Must Use `tsc`

If your project requires `tsc` to pass (e.g., in CI), you'll still need `@ts-expect-error` comments:

```typescript
"use operator overloading"

// @ts-expect-error - Operator overloading not supported by TypeScript
const sum = v1 + v2
```

The plugin will hide these in your editor, but `tsc` will still use them.

## Troubleshooting

### Plugin Not Working

1. **Check TypeScript version**: Ensure workspace TypeScript is used
   - VS Code: Check bottom-right corner
   - Should say "TypeScript ≥4.5.0"

2. **Restart TS Server**: Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"

3. **Verify plugin installed**: Check `node_modules/typescript-plugin-operator-overloading`

4. **Check logs** (debug mode enabled):
   ```
   [operator-overloading] Language service plugin loaded
   [operator-overloading] Suppressing error 2365 in vector-demo.ts
   ```

### Errors Still Showing

- Ensure file has `"use operator overloading"` in first 3 lines
- Check plugin is listed in `tsconfig.json`
- Verify using workspace TypeScript, not global

### Plugin Not Loading

- Make sure `typescript.tsdk` points to `node_modules/typescript/lib`
- Restart your editor completely
- Check for TypeScript configuration errors

## Architecture

```
┌─────────────────────────────────────┐
│  VS Code / WebStorm / IntelliJ      │
│            ↓                         │
│  TypeScript Language Server         │
│            ↓                         │
│  Plugin: getSemanticDiagnostics()   │
│            ↓                         │
│  Filter operator errors if directive│
│            ↓                         │
│  Return clean diagnostics to IDE    │
└─────────────────────────────────────┘
```

## Example Project

See `examples/vite-typescript/` for a complete working example with:

- ✅ Plugin configured in `tsconfig.json`
- ✅ VS Code settings in `.vscode/settings.json`
- ✅ Vector and Complex number classes with operator overloading
- ✅ No `@ts-expect-error` comments needed!

## Further Reading

- [TypeScript Language Service Plugins Documentation](https://github.com/microsoft/TypeScript/wiki/Writing-a-Language-Service-Plugin)
- [unplugin-op-overloading README](../README.md)
- [Design Document](./design.md)
