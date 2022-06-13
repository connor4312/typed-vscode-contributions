import { ApiRef } from './common';

export class ContextKey<T> {
  private _value?: T;

  /** Gets the context key value. */
  public get value() {
    return this._value;
  }

  /** Sets the context key value. */
  public set value(value: T | undefined) {
    if (value !== this._value) {
      this.api.get().commands.executeCommand('setContext', this.key, value);
      this._value = value;
    }
  }

  constructor(private readonly api: ApiRef, public readonly key: string) {}

  /** Creates an "equals" expression, usable in {@link when} */
  public equals(value: T) {
    return mustGetWhenAccessor()[this.key].equals(value as any);
  }

  /** Creates a "matches" expression, usable in {@link when} */
  public matches(re: string | RegExp) {
    return mustGetWhenAccessor()[this.key].matches(re);
  }

  /** Creates an truthy expression, usable in {@link when} */
  public truthy() {
    return mustGetWhenAccessor()[this.key].truthy();
  }
}

class DecisionNode {
  t?: DecisionNode | boolean;
  f?: DecisionNode | boolean;

  constructor(public readonly expression: string, public readonly depth: number) {}

  public *express(): Iterable<string> {
    let includeSelf = false;
    if (this.t === true && this.f === true) {
      return;
    } else if (this.t === true) {
      yield this.expression;
    } else if (this.f === true) {
      yield `!${this.expression}`;
    } else {
      includeSelf = true;
    }

    if (this.t instanceof DecisionNode) {
      for (const nested of this.t.express()) {
        yield includeSelf ? `${this.expression} && ${nested}` : nested;
      }
    }

    if (this.f instanceof DecisionNode) {
      for (const nested of this.f.express()) {
        yield includeSelf ? `!${this.expression} && ${nested}` : nested;
      }
    }
  }
}

export interface IContextKeyComparator {
  equals(value: string | number): boolean;
  matches(re: string | RegExp): boolean;
  truthy(): boolean;
}

let whenAccessor: { [key: string]: IContextKeyComparator } | undefined;

function mustGetWhenAccessor() {
  if (!whenAccessor) {
    throw new Error('This method may only be used inside a when() expression');
  }

  return whenAccessor;
}

export interface IContextKeyExpression {
  compile(): string;
}

export type ExpressionFunction = (context: { [key: string]: IContextKeyComparator }) => boolean;

export const when = (expr: ExpressionFunction): IContextKeyExpression => {
  return {
    compile() {
      const root = new DecisionNode('', 0);
      const queue = [0];
      let currentDecisions: number;

      let currentNode: DecisionNode;
      let lastResult: boolean;

      whenAccessor = new Proxy(
        {},
        {
          get(_target, key) {
            if (typeof key !== 'string') {
              throw new Error('Can only use context key strings');
            }

            const evaluate = (test: string) => {
              const depth = currentNode.depth;
              const prop = lastResult ? 't' : 'f';

              let next = currentNode[prop];
              if (!next) {
                next = currentNode[prop] = new DecisionNode(test, depth + 1);
                if (next.depth > 31) {
                  throw new Error('Expressions with depth >31 are not supported at this time');
                }
                queue.push(currentDecisions | (1 << next.depth));
              } else if (!(next instanceof DecisionNode) || next.expression !== test) {
                throw new Error(`When expression is non-deterministic`);
              }

              currentNode = next;
              return (lastResult = !!(currentDecisions & (1 << next.depth)));
            };

            return {
              equals: value => evaluate(`${key} == ${value}`),
              matches: re => evaluate(`${key} ~= ${typeof re === 'string' ? re : re.source}`),
              truthy: () => evaluate(key),
            } as IContextKeyComparator;
          },
        },
      );

      while (queue.length) {
        currentDecisions = queue.shift()!;
        currentNode = root;
        lastResult = true;
        const result = expr(whenAccessor);
        currentNode[lastResult ? 't' : 'f'] = result;
      }

      return [...(root.t as DecisionNode).express()].join(' || ');
    },
  };
};
