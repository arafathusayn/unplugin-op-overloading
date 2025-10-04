## Executive Summary

We propose a TypeScript‑first, **directive‑gated** operator‑overloading transform delivered as an **unplugin** that runs consistently across Vite, Rollup, Rolldown, webpack, Rspack, esbuild, and frameworks on top of them. Parsing uses **oxc‑parser** (JS/TS/JSX/TSX) and edits+sourcemaps use **MagicString**; both are chosen for speed and accuracy. Unplugin adapters expose `.vite()`, `.rollup()`, `.rolldown()`, `.webpack()`, `.rspack()`, and `.esbuild()` entry points, following the Rollup‑compatible plugin API unplugin standardizes. ([unplugin.unjs.io][1])

Key properties:

- **Safety by default**: file‑level opt‑in via `"use operator overloading"` among the first three top‑level statements. No pragma → no transform.
- **Semantics first**: single evaluation of operands; correct precedence; strict handling of `in`, `delete`, and the update operators; and an explicit opt‑in for equality overloading.
- **Interoperable**: sourcemaps are **hi‑res** to preserve debuggability through the pipeline. ([npm][2])
- **Bundler‑friendly**: ordering, hook support, and esbuild caveats follow unplugin’s current guidance; Rolldown compatibility rides on Rollup‑style hooks. ([unplugin.unjs.io][1])

---

## Table of Contents

1. [Objectives](#1-objectives)
2. [Scope](#2-scope)
3. [Functional Requirements](#3-functional-requirements)
4. [Non‑Functional Requirements](#4-non-functional-requirements)
5. [Opt‑In Directive](#5-opt-in-directive)
6. [Architecture](#6-architecture)
7. [Operator Semantics](#7-operator-semantics)
8. [Parser, Spans & Editing](#8-parser-spans--editing)
9. [Public API](#9-public-api)
10. [Bundler Integration](#10-bundler-integration)
11. [Performance Strategy](#11-performance-strategy)
12. [Correctness & Safety](#12-correctness--safety)
13. [Edge Cases & Unsupported Forms](#13-edge-cases--unsupported-forms)
14. [Runtime Symbol Contract](#14-runtime-symbol-contract)
15. [Testing Strategy](#15-testing-strategy)
16. [Versioning & Rollout](#16-versioning--rollout)
17. [Transform Skeleton (Pseudocode)](#17-transform-skeleton-pseudocode)
18. [Risk Assessment & Mitigations](#18-risk-assessment--mitigations)
19. [Appendix A — Operator Matrix](#appendix-a--operator-matrix)

---

## 1. Objectives

Deliver a safe, ergonomic, and high‑throughput operator‑overloading transform that:

- Preserves JavaScript evaluation order and side‑effects for all supported operators.
- Emits compact IIFEs that dispatch to `obj[Symbol.for(op)]` with native fallbacks.
- Gates equality overloading (`==`, `!=`, `===`, `!==`) behind an explicit option.
- Produces accurate, chainable source maps suitable for modern bundler stacks.

---

## 2. Scope

**Inputs**: `.js`, `.ts`, `.jsx`, `.tsx`.
**Activation**: Only when a file contains the exact top‑level directive `"use operator overloading"` in its first three statements (coexists with `"use strict"`, `"use client"`, etc.).
**Parser**: **oxc‑parser** (production‑ready, JS/TS/JSX/TSX). ([Oxc][3])
**Edits & Maps**: **MagicString** (`generateMap({ hires: true })` by default). ([npm][2])

**Out of scope**:
Type‑aware transforms; any change to logical short‑circuiting (`&&`, `||`, `??`) or logical assignment (`&&=`, `||=`, `??=`); `instanceof` (JS already supports customizing via `Symbol.hasInstance`); `typeof`, `void`, `Object.is`, Map/Set key identity. ([MDN Web Docs][4])

> **Prior art**: The design mirrors (but refines) the experimental Babel approach of dispatching to `Symbol.for(op)` when present, with native fallback. ([GitHub][5])

---

## 3. Functional Requirements

1. **Directive gate**: transform only when the enabling directive is present among the first three top‑level statements; otherwise no‑op.
2. **Operators**
   - **Binary**: `+ - * / % ** & | ^ << >> >>> < <= > >=` and **`in` (special handling)**.
   - **Equality (option‑gated)**: `== != === !==`.
   - **Unary**: `+ - ~ ! delete` (skip `typeof`, `void`).
   - **Update**: `++ --` (prefix & postfix; implemented as sugar over `+= 1` / `-= 1` to ensure LHS is updated correctly).
   - **Compound assignment**: `+= -= *= /= %= **= &= |= ^= <<= >>= >>>=`.
     - **Explicitly exclude** `&&=`, `||=`, `??=` (short‑circuiting semantics cannot be rewritten safely).

3. **Semantics**
   - **Single evaluation** of operands and member bases/keys.
   - **Correct precedence** via IIFEs.
   - **Accurate prefix/postfix** result values for updates.
   - **Equality methods** must return booleans; results are normalized with `!!` before negations.

4. **Re‑entrancy guard**: synthesized IIFEs begin with a directive string `"operator-overloading disabled"`; the transformer recognizes and **skips** bodies starting with this sentinel to avoid touching generated code in re‑runs.

---

## 4. Non‑Functional Requirements

- **Fast**: parse once with oxc, minimal traversal, batched string edits.
- **Stable**: zero output changes for files without the directive; clear diagnostics only in `debug` mode.
- **Portable**: unplugin adapters for all major bundlers, including Rolldown for modern Vite. ([unplugin.unjs.io][1])

---

## 5. Opt‑In Directive

**Rule**: a file is eligible only if it contains `"use operator overloading"` among `Program.body[0..2]`.

**Detection**:

- Accept `Directive` or `ExpressionStatement(StringLiteral)` representations.
- Only file‑level (no block‑level enabling).
- Generated IIFEs embed a **disabling** directive (the sentinel) but never re‑enable.

---

## 6. Architecture

- **Adapter layer**: `unplugin` factory exporting `.vite()`, `.rollup()`, `.rolldown()`, `.webpack()`, `.rspack()`, `.esbuild()`; all share one core. ([unplugin.unjs.io][1])
- **Core**:
  - Parse with **oxc‑parser** to get AST + byte spans. ([Oxc][3])
  - Visit `BinaryExpression`, `UnaryExpression`, `UpdateExpression`, `AssignmentExpression`.
  - Replace eligible spans via **MagicString**; emit hires sourcemaps. ([npm][2])

- **No runtime package required**; we emit plain JS IIFEs that dispatch to `Symbol.for(...)` on the value or (for `in`) on the **RHS** object (see §7.2).

---

## 7. Operator Semantics

### 7.1 Binary (general case)

```js
(() => {
  "operator-overloading disabled";
  const __lhs = LHS;
  const __rhs = RHS;
  const __sym = Symbol.for("OP");            // e.g., "+", "*", "<", etc.
  return __lhs != null && __lhs[__sym] !== undefined
    ? __lhs[__sym](__rhs)
    : (__lhs OP __rhs);
})()
```

**Notes**

- We **do not** touch `&&`, `||`, `??`, or `instanceof` (customize `instanceof` via `Symbol.hasInstance` on the RHS constructor if desired). ([MDN Web Docs][4])

### 7.2 Specialization: `in` (RHS‑dispatch)

Native `key in obj` reads properties from the **RHS** object; overloading must therefore dispatch on `obj`, not `key`. Rewrite:

```js
;(() => {
  'operator-overloading disabled'
  const __key = KEY // left operand
  const __obj = OBJ // right operand
  const __sym = Symbol.for('in')
  return __obj != null && __obj[__sym] !== undefined
    ? __obj[__sym](__key)
    : __key in __obj
})()
```

> This corrects a common pitfall in earlier experimental plugins that handled only left‑hand dispatch. ([GitHub][5])

### 7.3 Equality (option‑gated)

Option `equality: 'off' | 'loose' | 'strict' | 'both'` (default: `'off'`).

```js
;(() => {
  'operator-overloading disabled'
  const __lhs = LHS,
    __rhs = RHS
  const __sym = Symbol.for('==') // or "===", see mapping table
  const __res =
    __lhs != null && __lhs[__sym] !== undefined
      ? __lhs[__sym](__rhs)
      : __lhs == __rhs // (or === ...)
  return !!__res // normalize to boolean
})()
```

`!=` / `!==` are compiled as negations of the corresponding normalized equality.

### 7.4 Unary

For `+ - ~ !`:

```js
(() => {
  "operator-overloading disabled";
  const __arg = ARG;
  const __sym = Symbol.for(UNARY_SYMBOL); // "plus" | "minus" | "~" | "!"
  return __arg != null && __arg[__sym] !== undefined
    ? __arg[__sym]()
    : (OP __arg);
})()
```

**`delete`** (property forms only):

```js
;(() => {
  'operator-overloading disabled'
  const __obj = OBJ,
    __key = KEY // KEY is identifier or computed
  const __sym = Symbol.for('delete')
  return __obj != null && __obj[__sym] !== undefined
    ? !!__obj[__sym](__key) // must produce boolean
    : delete __obj[__key] // preserves native semantics
})()
```

- `delete` over private fields is a SyntaxError natively; we **never** rewrite those forms. ([MDN Web Docs][6])
- Native semantics: returns `false` on non‑configurable own properties in sloppy mode, **throws** in strict mode; our fallback preserves that behavior. ([MDN Web Docs][7])

### 7.5 Update (`++`, `--`) via compound‑assignment sugar

We **do not** invent new symbol hooks for updates because they must **write back** to the LHS (including member expressions). We therefore compile them as sugar over `+= 1` / `-= 1` and reuse the compound‑assignment machinery:

- **Prefix** `++x`:

```js
;(() => {
  'operator-overloading disabled'
  // Reuse compound-assignment transform:
  return (LHS = __binaryOverload(LHS, 1, '+')) // returns the new value
})()
```

- **Postfix** `x++`:

```js
(() => {
  "operator-overloading disabled";
  const __base = BASE, __key = KEY?;         // only if member
  const __old = (IS_MEMBER ? __base[__key] : LHS);
  const __new = __binaryOverload(__old, 1, "+");
  (IS_MEMBER ? (__base[__key] = __new) : (LHS = __new));
  return __old;                               // postfix result
})()
```

This is the only approach that (1) updates member LHS correctly and (2) returns the mandated old/new value.

### 7.6 Compound assignment (`OP=`)

Exclude logical‑assignment (`&&=`, `||=`, `??=`). For others:

- **Identifier LHS**: `x OP= y` → `x = bin(x, y, "OP")`.
- **Member LHS** (evaluate base and key once):

```js
;(() => {
  'operator-overloading disabled'
  const __obj = OBJ,
    __key = KEY
  const __lhs = __obj[__key]
  const __rhs = RHS
  const __res = __binaryOverload(__lhs, __rhs, 'OP') // e.g., "+"
  return (__obj[__key] = __res)
})()
```

`__binaryOverload(a, b, "OP")` is an inlined template (from §7.1) to avoid importing a runtime.

---

## 8. Parser, Spans & Editing

- **oxc‑parser**: fast, conformant, production‑ready; parses JS/TS with JSX/TSX and exposes spans. ([Oxc][3])
- **MagicString**: all replacements are span‑based; we generate v3 sourcemaps with `hires: true`, which maps every character for more precise devtools correlation. ([npm][2])

---

## 9. Public API

```ts
export interface OperatorOverloadingOptions {
  /**
   * Equality operator overloading mode.
   * 'off'   → do not touch ==/!=/===/!==
   * 'loose' → transform == and !=
   * 'strict'→ transform === and !==
   * 'both'  → transform all four
   */
  equality?: 'off' | 'loose' | 'strict' | 'both' // default: 'off'

  /**
   * Files to include/exclude. These are *advisory* filters on top of
   * the per-file directive gate.
   */
  include?: string | string[] // default: **/*.{ts,tsx,js,jsx,mjs,cjs}
  exclude?: string | string[] // default: node_modules/**

  /** Extra debug logging; does not change emitted code. */
  debug?: boolean // default: false

  /**
   * Optional namespace prefix for Symbol.for keys to avoid global registry
   * collisions (see §14). Example: 'oo' → Symbol.for('oo/+'), 'oo/=='...
   */
  symbolsNamespace?: string | false // default: false
}
```

---

## 10. Bundler Integration

- **Adapters**: `.vite()`, `.rollup()`, `.rolldown()`, `.webpack()`, `.rspack()`, `.esbuild()` provided via `createUnplugin`. ([unplugin.unjs.io][1])
- **Ordering**:
  - In **Vite**, prefer `enforce: 'pre'` (classic) or `order: 'pre'` in Vite’s plugin API to run early, before heavy transforms. (Vite resolves user plugins with `'pre'` first, then core, then normal, then `'post'`.) ([GitHub][8])
  - Rollup & esbuild do **not** support `enforce/order`; users control order by array position. ([unplugin.unjs.io][1])

- **esbuild** adapter**:** unplugin notes that although esbuild can handle many formats, `load/transform` can **only return JavaScript**; ensure the adapter returns JS (TS types may remain in source for a later pass, but the adapter’s output is JS). ([unplugin.unjs.io][1])
- **Rolldown**: rollup‑compatible API, designed as Vite’s unified bundler; our rollup‑style hooks work unchanged. ([Rolldown][9])

---

## 11. Performance Strategy

- **Early bail**: parse and scan only the first 3 statements for the directive; if absent, **return null** (unplugin will skip downstream work).
- **Single parse** with oxc; minimal node visitation; eager short‑circuiting in visitors.
- **Batch edits** per file with a single `MagicString` instance; `generateMap({ hires: true })` to avoid fragile, sparse mappings. ([npm][2])
- **Filter aggressively** at plugin level using unplugin’s `transform.filter` to reduce work in native bundlers. ([unplugin.unjs.io][1])

---

## 12. Correctness & Safety

- **Single evaluation** of LHS/RHS/ARG and of member base/key.
- **`in` semantics** dispatch on the RHS object (see §7.2).
- **Equality** results normalized to booleans before negation.
- **Update** operators compiled to compound‑assignment sugar to ensure the write‑back happens for both identifiers and members.
- **Short‑circuiting**: we **never** transform logical operators or logical assignments; we avoid any transformation that would change short‑circuit behavior under optional chaining (`?.`)—only inner expressions that would be evaluated natively are rewritten. (Per spec/design notes: computed keys under `a?.[expr]` are **not** evaluated if the base is nullish; our transform keeps `expr` inside the same evaluation context.) ([cs.unb.ca][10])

---

## 13. Edge Cases & Unsupported Forms

- **Private fields**: no transforms for `obj.#x`, `delete obj.#x`, or any update/compound assignment touching private names. Preserve native errors. ([MDN Web Docs][6])
- **Destructuring**: compound assignment on patterns (e.g., `[a] += b`) is invalid → untouched.
- **BigInt + String** or other native TypeErrors occur in fallback paths exactly as in native evaluation.
- **`instanceof`**: left alone; customize with `Symbol.hasInstance` on the RHS constructor per standard JS. ([MDN Web Docs][4])

---

## 14. Runtime Symbol Contract

We dispatch to `target[Symbol.for(key)]` where `key` is a **string**. The global Symbol registry guarantees the same symbol is returned for the same key across modules/realms. To reduce collision risk, an optional `symbolsNamespace` may prefix keys (e.g., `oo/+/binary`). ([MDN Web Docs][11])

**Binary** keys: `"+"","-","*","/","%","**","&","|","^","<<",">>",">>>","<","<=",">",">=","in"`
**Equality** keys (if enabled): `"=="","==="`
**Unary** keys: `"plus","minus","~","!","delete"`

> Rationale: Using `Symbol.for` shares keys across packages and bundles by design; namespacing helps avoid accidental reuse. ([MDN Web Docs][11])

---

## 15. Testing Strategy

- **Unit (Vitest)**: each operator, member LHS with getters (exactly once), equality modes, delete semantics (strict & sloppy), update prefix/postfix for identifiers & members.
- **Golden snapshots**: transformed outputs for representative samples.
- **Property tests**: With **no** symbol hooks defined, the transformed output must match native evaluation for pure expressions.
- **Sourcemaps**: pathologically nested edits + `hires` snapshots to catch drift. ([npm][2])

---

## 16. Versioning & Rollout

- **v0.1**: core binary/unary (no equality), directive gating, oxc parser, sourcemaps.
- **v0.2**: `delete` specialization + robust member LHS handling.
- **v0.3**: equality modes (`loose`, `strict`, `both`) + boolean normalization.
- **v0.4**: perf polish, optional symbol namespace, documentation & examples.

---

## 17. Transform Skeleton (Pseudocode)

```ts
import MagicString from 'magic-string'
import { parse } from 'oxc-parser'
import { createUnplugin } from 'unplugin'

const FILE_ENABLE = 'use operator overloading'
const GEN_DISABLE = 'operator-overloading disabled'

export interface Options extends OperatorOverloadingOptions {}
export const unplugin = createUnplugin<Options | undefined>((options = {}) => ({
  name: 'unplugin-operator-overloading',
  // Vite honors 'enforce'/'order'; elsewhere, array position controls order.
  enforce: 'pre',

  transform: {
    // Use unplugin's filter to narrow files in native bundlers
    filter: {
      id: {
        include: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
        exclude: 'node_modules/**',
      },
    },
    handler(code, id) {
      if (!/\.(m|c)?[tj]sx?$/.test(id)) return null

      // 1) Parse with oxc (TS/JSX enabled)
      const ast = parse(code, {
        /* ts/jsx flags */
      })

      // 2) Early opt-in gate
      if (!hasDirective(ast, FILE_ENABLE)) return null

      const s = new MagicString(code)
      // 3) Walk & rewrite with span-accurate edits
      //    - Binary: general + specialization for `in`
      //    - Unary: including `delete` specialization
      //    - Update: sugar to compound-assignment
      //    - Assignment: OP= excluding logical assignments

      // ... (omitted: visitor + wrap helpers mirroring §7 templates)

      if (!s.hasChanged()) return null
      return {
        code: s.toString(),
        map: s.generateMap({ hires: true, source: id }), // hi-res mapping
      }
    },
  },
}))

function hasDirective(ast: any, value: string): boolean {
  const body = ast.program.body ?? []
  for (let i = 0; i < Math.min(3, body.length); i++) {
    const stmt = body[i]
    if (stmt.type === 'Directive' && stmt.value?.raw === value) return true
    if (
      stmt.type === 'ExpressionStatement' &&
      stmt.expression.type === 'StringLiteral' &&
      stmt.expression.value === value
    )
      return true
  }
  return false
}
```

> Unplugin adapters expose `.vite()`, `.rollup()`, `.rolldown()`, `.webpack()`, `.rspack()`, `.esbuild()` from the created instance. ([unplugin.unjs.io][1])

---

## 18. Risk Assessment & Mitigations

| Risk                                  | Impact  | Mitigation                                                                                                           |
| ------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------- |
| **Semantic surprises with equality**  | High    | Default `equality: 'off'`; methods must return booleans; normalize with `!!` before negation; document clearly.      |
| **Incorrect `in` semantics**          | Medium  | RHS‑dispatch specialization (§7.2).                                                                                  |
| **Update operators not writing back** | Medium  | Implement via compound‑assignment sugar (§7.5).                                                                      |
| **AST/offset mismatches**             | Medium  | Use oxc spans + MagicString only; add snapshot tests around whitespace/comments. ([Oxc][3])                          |
| **Sourcemap drift**                   | Medium  | `hires: true` sourcemaps; integration tests in Vite/Rollup devtools. ([npm][2])                                      |
| **Global Symbol registry collisions** | Low/Med | Optional namespace (`symbolsNamespace`), documented keys; `Symbol.for` behavior is predictable. ([MDN Web Docs][11]) |
| **Plugin ordering issues**            | Low/Med | Use `enforce/order` in Vite; instruct users on explicit ordering elsewhere. ([GitHub][8])                            |
| **esbuild adapter returns non‑JS**    | Low     | Ensure adapter always returns JS as per unplugin note. ([unplugin.unjs.io][1])                                       |

---

## Appendix A — Operator Matrix

| Category          | Operators                 | Dispatch target    | Symbol.for key(s)                 | Notes                                                              |                   |     |            |
| ----------------- | ------------------------- | ------------------ | --------------------------------- | ------------------------------------------------------------------ | ----------------- | --- | ---------- |
| Arithmetic        | `+ - * / % **`            | LHS                | `"+"`…`"**"`                      | Ensure single eval of both operands; precedence via IIFE.          |                   |     |            |
| Bitwise           | `&                        | ^ << >> >>>`       | LHS                               | `"&"`…`">>>"`                                                      | As above.         |     |            |
| Relational        | `< <= > >=`               | LHS                | `"<"`, `"<="`, `">"`, `">="`      | Return boolean from custom methods.                                |                   |     |            |
| **Membership**    | **`in`**                  | **RHS**            | `"in"`                            | Specialized template (§7.2).                                       |                   |     |            |
| Equality (opt‑in) | `== != === !==`           | LHS                | `"=="`, `"==="`                   | Normalized to boolean; `!=/!==` compiled as negation.              |                   |     |            |
| Unary             | `+ - ~ !`                 | Arg                | `"plus"`, `"minus"`, `"~"`, `"!"` | 0‑arg methods.                                                     |                   |     |            |
| `delete`          | `delete obj[key]`         | RHS object         | `"delete"`                        | Must return boolean; private fields untouched. ([MDN Web Docs][6]) |                   |     |            |
| Update            | `++ --`                   | LHS                | —                                 | Compiled as sugar over compound assignment (§7.5).                 |                   |     |            |
| Compound assign   | `+= -= \*= /= %= \*\*= &= | = ^= <<= >>= >>>=` | LHS                               | Binary key                                                         | Excludes `&&=`, ` |     | =`, `??=`. |

---

## References

- **unplugin**: unified plugin system; supported adapters; hook caveats (ordering & esbuild return type). ([unplugin.unjs.io][1])
- **oxc‑parser**: production‑ready, parses JS/TS/JSX/TSX with speed/conformance claims. ([Oxc][3])
- **MagicString**: sourcemap API; `hires` behavior. ([npm][2])
- **Rolldown**: Rust bundler with Rollup‑compatible API; designed for Vite integration. ([Rolldown][9])
- **Babel prior art** using `Symbol.for(op)` and left‑hand dispatch. ([GitHub][5])
- **JS semantics** for `instanceof` (`Symbol.hasInstance`) and `delete`. ([MDN Web Docs][4])

---

### Changelog (vs. professional draft)

- **Fixed**: `in` now dispatches on **RHS**.
- **Clarified**: update operators compiled as sugar over `+= 1` / `-= 1` (no bespoke hooks).
- **Excluded**: logical assignment operators (`&&=`, `||=`, `??=`).
- **Normalized**: equality results coerced to booleans.
- **Integration**: updated unplugin/Vite/Rolldown guidance and esbuild caveats with citations.
- **Symbol hygiene**: optional `symbolsNamespace` to minimize global registry collision risk.

> The original draft remains the backbone of this design; the present version closes correctness gaps and aligns docs and integration with current ecosystem guidance.

---

[1]: https://unplugin.unjs.io/guide/ 'Getting Started | Unplugin'
[2]: https://www.npmjs.com/package/magic-string?utm_source=chatgpt.com 'magic-string - npm'
[3]: https://oxc.rs/docs/guide/usage/parser.html 'Parser | The JavaScript Oxidation Compiler'
[4]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/hasInstance?utm_source=chatgpt.com 'Symbol.hasInstance - JavaScript | MDN'
[5]: https://github.com/foxbenjaminfox/babel-plugin-overload 'GitHub - foxbenjaminfox/babel-plugin-overload: A highly experimental babel plugin for operator overloading in javascript'
[6]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Cant_delete_private_fields?utm_source=chatgpt.com "SyntaxError: private fields can't be deleted - JavaScript | MDN"
[7]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/delete?utm_source=chatgpt.com 'delete - JavaScript | MDN - MDN Web Docs'
[8]: https://github.com/vitejs/vite/blob/main/docs/guide/api-plugin.md?plain=1&utm_source=chatgpt.com 'vite/docs/guide/api-plugin.md at main · vitejs/vite · GitHub'
[9]: https://rolldown.rs/ 'Rolldown'
[10]: https://www.cs.unb.ca/~bremner/teaching/cs2613/books/mdn/Reference/Operators/Optional_chaining/?utm_source=chatgpt.com 'Optional chaining (?.) - UNB'
[11]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol?utm_source=chatgpt.com 'Symbol - JavaScript | MDN - MDN Web Docs'
