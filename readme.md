# typed-vscode-contributions

VS Code has many [contribution points](https://code.visualstudio.com/api/references/contribution-points). Many of these contribution points go along with JavaScript code you write in your extension, and this packages makes interoperating with them easier and more type-safe. You can even do crazy things like use the [when expression builder](#when).

## Quickstart

First, you can register your contributions. Let's make a "hello world" command in a new `contributions.ts` file.

**src/contributions.ts**

```ts
import * as vscode from 'vscode';
import { Contributions } from 'typed-vscode-contributions';

// Make the new contribution "container"
export const contributions = new Contributions(vscode);

// Make a command that expects a string as its first argument
export const helloWorld = contributions.command<string>({
  id: 'helloWorld',
  title: 'Hello World',
})();
```

Then you can register that command easily:

**src/extension.ts**

```ts
import { helloWorld, contributions } from './contributions';

export function activate(context) {
  context.subscriptions.push(
    // register the command, it knowns "name" is a string!
    helloWorld.register(name => {
      console.log(`Hello ${name}`);
    }),
  );

  // Asserts all contributions were registered so you can get a nice
  // error message if you forgot anything:
  contributions.assertRegistered();

  // You can also call commands just as easily and safely:
  await helloWorld.call('Connor');
}
```

This package provides strongly-typed wrappers for most contribution points, and it exposes to `.toJSON()` method you can use and integrate into your build process in order to update your package.json. Let's make a build script you can run to do that:

**build.js**

```js
const { contributions } = require('./out/contributions.js');
const fs = require('fs');
// read the current package.json
const packageJson = JSON.parse(fs.readFileSync('package.json'), 'utf-8');
// add tr contributions to it
fs.writeFileSync(
  'package.json',
  JSON.stringify({ ...packageJson, ...contributions.toJSON() }, null, 2),
);
```

From this, you can get a package.json that looks something like:

```json
{
  "name": "cool-extension",
  "activationEvents": ["onCommand:helloWorld"],
  "contributes": {
    "commands": [
      {
        "command": "helloWorld",
        "title": "Hello World"
      }
    ]
  }
}
```

## Commands

## `contributions.externalCommand<TArgs>(id)<TReturnType>()`

You can use this to get a type-safe handle for an external command. The resulting object only has a `.call()` method on it.

```ts
// A command with no return value:
const greet = contributions.externalCommand<[string]>('greet')();
await greet.call('Connor');

// A command with a return value:
const add = contributions.externalCommand<[number, number]>('add')<number>();
console.log('2 + 3', await add.call(2, 3));
```

## `contributions.externalCommand<TArgs>(options)<TReturnType>()`

A very similar interface to `externalCommand`, except that the returned type can also be `registered`, and it takes an options object for its contributions.

```ts
const add = contributions.command<[number, number]>({
  id: 'add',
  title: 'Add Numbers',
})<number>();

// later

context.subscriptions.push(
  add.register((a, b) => {
    return a + b;
  }),
);
```

## Context Keys

## `contributions.contextKey<T>(key)`

Creates a new context key, that has a `value` which can be get and set.

```ts
const isCool = contributions.contextKey('isCool');

isCool.value = true;

if (isCool.value) {
  console.log("You're cool");
}
```

You can also use this in `when` expressions.

## `when`

A fancy automatic builder for `when` clauses. Inside the expression, you can make comparisons with context keys, and it will return an object with a `compile` function that converts this into a standard `when` clause string.

```ts
// You can use methods on context keys themselves, or use anything on
// `ctx` to look up keys you don't have types for.
const expr = when(ctx => isCool.equals(true) && ctx.editorIsOpen.truthy());
console.log(ctx.compile()); // isCool == true && editorIsOpen

// Expressions can be as complex as you want.
when(ctx =>
  ctx.editorIsOpen.truthy()
    ? ['typescript', 'javascript'].some(l => ctx.editorLangId.equals(l))
    : ctx.isInDebugMode.truthy(),
);
// => isEditorOpen && editorLangId == typescript || isEditorOpen && editorLangId == javascript || !isEditorOpen && isInDebugMode
```
