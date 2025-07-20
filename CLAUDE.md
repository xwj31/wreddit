# TypeScript Coding Rules v5 (Final)

## Type Safety Rules

- **No `any` or `as any`**: Do not use `any` or type assertions with `as any` unless the data is truly runtime in nature and cannot be statically typed. When dealing with runtime data, validate it using Yup schemas.
- **Explicit function signatures**: All functions must have well-defined parameter types and return types.
- **Use `type` over `interface`**: Use `type` for data shapes and `interface` only when defining actual contracts/services that may be implemented.
- **Strict equality**: Use `===` and `!==` over `==` and `!=` for comparisons.
- **No `eval()`**: Never use `eval()` on strings as it opens security vulnerabilities.

## Code Quality Rules

- **No code repetition**: Repeated code must be extracted into reusable functions.
- **Descriptive naming**: Use clear, descriptive names for variables, functions, and types. Avoid single letter names except for short loop indices.
- **Prefer `const` assertions**: Use `as const` for literal types instead of manual type definitions where appropriate.
- **No implicit returns**: Always explicitly return values from functions.
- **Use utility types**: Leverage TypeScript utility types (`Pick`, `Omit`, `Partial`, etc.) instead of manual type definitions.
- **Variable declarations**: Use `const` for all references that won't be reassigned, `let` for variables that will be reassigned. Never use `var`.
- **No unused variables**: Disallow unused variables and imports.

## Object & Array Rules

- **Object literals**: Use object literal syntax instead of `new Object()`.
- **Array literals**: Use array literal syntax instead of `new Array()`.
- **Object method shorthand**: Use shorthand syntax for object methods.
- **Property shorthand**: Use property value shorthand when variable name matches property name.
- **Property ordering**: Group shorthand properties at the beginning of object declarations:

  ```typescript
  // Good
  const obj = {
    name,        // shorthand first
    age,         // shorthand first  
    id: 1,       // regular properties after
    email: 'x'
  };
  
  // Bad
  const obj = {
    id: 1,
    name,        // shorthand mixed with regular
    email: 'x',
    age          // shorthand mixed with regular
  };
  ```

- **Computed properties**: Use computed property names when creating objects with dynamic properties.
- **Object spread**: Prefer object spread syntax over `Object.assign()` for shallow copying.
- **Array spread**: Use array spread `...` to copy arrays instead of loops.
- **Destructuring**: Use object and array destructuring when accessing multiple properties.

## String & Template Rules

- **Single quotes**: Use single quotes `''` for strings, template literals only when interpolating or using newlines.
- **Template literals**: Use template strings instead of concatenation when building strings programmatically.
- **No unnecessary escaping**: Don't unnecessarily escape characters in strings.

## Function Design Rules

- **Single responsibility**: Functions should handle single actions and be testable in isolation.
- **No long functions**: Keep functions short and focused. Break complex logic into smaller, composable functions.
- **Fail early**: Always validate inputs and fail early in functions with clear error messages.
- **Named function expressions**: Use named function expressions instead of function declarations: `const foo = function namedFoo() {}` instead of `function foo() {}`. This prevents hoisting issues and provides better stack traces.
- **Arrow functions**: Use arrow functions for anonymous functions and callbacks. Always include parentheses around parameters, even for single parameters: `(x) => x + 1` not `x => x + 1`.
- **Default parameters**: Use default parameter syntax instead of mutating function arguments.
- **Rest parameters**: Use rest syntax `...` instead of `arguments`.
- **No parameter mutation**: Don't mutate or reassign function parameters.

## Class & Module Rules

- **Use classes**: Always use `class` syntax instead of manipulating `prototype` directly.
- **Class inheritance**: Use `extends` for inheritance.
- **Method chaining**: Methods can return `this` for method chaining.
- **No duplicate members**: Avoid duplicate class member declarations.
- **Static methods**: Use static methods when methods don't use `this`.
- **ES modules**: Always use `import`/`export` over other module systems.
- **No wildcard imports**: Avoid wildcard imports, use specific imports.
- **Import organization**: Put all imports at the top, group related imports.
- **No default export mixing**: Don't export directly from an import.

## Project Structure Rules

- **Shared types separation**: Use separate folders/files for shared types that are used across multiple modules.
- **Folder organization**: Structure code using logical folders (e.g., `utils/`, `shared/`, `types/`, `services/`).
- **Layer separation**: Keep the presentation layer separate from the functional/business logic layer.
- **Domain grouping**: Group related functionality together while maintaining clear boundaries.

## Formatting & Style Rules

- **Semicolons**: Always use semicolons to terminate statements.
- **Trailing commas**: Use trailing commas in multiline objects, arrays, and function parameters.
- **Braces**: Use braces with all multiline blocks.
- **Indentation**: Use 2 spaces for indentation.
- **Line length**: Avoid lines longer than 100 characters.
- **Whitespace**:
  - Place 1 space before opening braces
  - Place 1 space before opening parenthesis in control statements
  - No space between function name and parentheses in function calls
  - Set off operators with spaces
  - No spaces inside parentheses, brackets
  - Spaces inside curly braces
- **Block spacing**: Leave blank lines after blocks and before next statements.
- **No trailing spaces**: Avoid trailing whitespace at end of lines.

## Naming Conventions

- **camelCase**: Use camelCase for variables, functions, and object properties.
- **PascalCase**: Use PascalCase for classes, constructors, and type names.
- **UPPER_CASE**: Use UPPER_CASE only for exported constants that never change.
- **File naming**: Filename should match the default export name.
- **Acronyms**: Acronyms should be all uppercase or all lowercase, not mixed case.
- **Boolean prefixes**: Use `is`, `has`, `can`, `should` prefixes for boolean functions.
- **No underscores**: Don't use leading or trailing underscores unless required by external APIs.

## Comment Standards

- **Multiline comments**: Use `/** ... */` for multiline comments.
- **Single line comments**: Use `//` for single line comments, place on newline above subject.
- **Comment spacing**: Start all comments with a space.
- **Action items**: Use `// FIXME:` for problems, `// TODO:` for solutions to implement.

## TypeScript Configuration Rules (tsconfig.json)

### Base Configuration (Required for All Projects)

```json
{
  "compilerOptions": {
    "esModuleInterop": true,
    "skipLibCheck": true,
    "target": "es2022",
    "allowJs": true,
    "resolveJsonModule": true,
    "moduleDetection": "force",
    "isolatedModules": true,
    "verbatimModuleSyntax": true
  }
}
```

- **esModuleInterop**: Enables better CommonJS/ES Module interoperability
- **skipLibCheck**: Skip type checking of declaration files for performance
- **target**: Use `es2022` for stability over `esnext`
- **allowJs**: Allow importing JavaScript files
- **resolveJsonModule**: Allow importing JSON files
- **moduleDetection**: Force all files to be treated as modules
- **isolatedModules**: Prevent unsafe features when treating modules as isolated files
- **verbatimModuleSyntax**: Enforce explicit `import type` and `export type` usage

### Strictness Configuration (Required for All Projects)

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

- **strict**: Enable all strict type checking options
- **noUncheckedIndexedAccess**: Require index access to be checked before use
- **noImplicitOverride**: Require explicit `override` keyword in classes

### For Applications (Transpiling with TypeScript)

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "outDir": "dist",
    "sourceMap": true
  }
}
```

- **module**: Use `NodeNext` for Node.js applications
- **outDir**: Output compiled files to `dist` directory
- **sourceMap**: Generate source maps for debugging

### For Libraries

```json
{
  "compilerOptions": {
    "declaration": true
  }
}
```

- **declaration**: Generate `.d.ts` files for library consumers

### For Libraries in Monorepos

```json
{
  "compilerOptions": {
    "declaration": true,
    "composite": true,
    "sourceMap": true,
    "declarationMap": true
  }
}
```

- **composite**: Enable TypeScript project references
- **declarationMap**: Generate declaration source maps

### For Bundled Applications (Not Transpiling with TypeScript)

```json
{
  "compilerOptions": {
    "module": "preserve",
    "noEmit": true
  }
}
```

- **module**: Use `preserve` to match bundler behavior
- **noEmit**: Don't generate JavaScript files

### Environment-Specific Configuration

**For DOM Applications:**

```json
{
  "compilerOptions": {
    "lib": ["es2022", "dom", "dom.iterable"]
  }
}
```

**For Node.js Applications:**

```json
{
  "compilerOptions": {
    "lib": ["es2022"]
  }
}
```

## Additional Rules

- **Strict null checks**: Handle null/undefined cases explicitly.
- **Error handling**: Functions that can fail should return Result types or throw typed errors.
- **Boolean shortcuts**: Use shortcuts for booleans, explicit comparisons for strings and numbers.
- **Ternary operators**: Avoid nested ternaries, avoid unneeded ternary statements.

---

*These rules represent a comprehensive, production-ready TypeScript coding standard combining our original requirements with proven practices from the Airbnb JavaScript Style Guide.*
