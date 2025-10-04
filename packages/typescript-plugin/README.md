# TypeScript Plugin - Operator Overloading

TypeScript Language Service Plugin that suppresses operator-related type errors in files with the `"use operator overloading"` directive.

## Installation

```bash
bun install typescript-plugin-operator-overloading
```

## Usage

### 1. Configure TypeScript

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

### 2. Configure Your Editor

**VS Code:**

Create or update `.vscode/settings.json`:

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

Restart VS Code or reload the TypeScript server (Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server").

**WebStorm / IntelliJ IDEA:**

The plugin should be automatically detected from `tsconfig.json`.

### 3. Use in Your Code

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

// No TypeScript errors in the editor!
const sum = v1 + v2
```

## Debug Mode

Enable debug logging to see which errors are being suppressed:

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

Check the TypeScript server log in VS Code: View → Output → TypeScript

## How It Works

The plugin intercepts TypeScript's semantic diagnostics and filters out operator-related errors (TS2365, TS2362, TS2363, TS2460) in files containing the directive.

## Important Notes

- ⚠️ **This plugin only affects the IDE experience**. It does NOT affect `tsc` command-line compilation.
- ⚠️ Use with unplugin-op-overloading for builds (Vite/Webpack/etc).
- ⚠️ The `@ts-expect-error` comments are still needed if you run `tsc` directly.

## License

Apache-2.0
