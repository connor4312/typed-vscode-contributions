import { describe, expect, it, test } from 'vitest';
import { Contributions } from '.';
import { ExpressionFunction, when } from './contextKey';

describe('when()', () => {
  const ttable: [ExpressionFunction, string][] = [
    [c => c.a.equals(42), 'a == 42'],
    [c => c.b.truthy(), 'b'],
    [c => c.b.truthy() && c.a.equals(42), 'b && a == 42'],
    [c => c.b.truthy() || c.a.equals(42), 'b || a == 42'],
    [c => (c.b.truthy() ? c.a.equals(1) : c.a.equals(2)), 'b && a == 1 || !b && a == 2'],
    [c => [1, 2, 3, 4].some(v => c.a.equals(v)), 'a == 1 || a == 2 || a == 3 || a == 4'],
    [
      context =>
        context.a.truthy()
          ? context.b.equals(1) || (context.c.equals(2) && context.c.equals(4))
          : context.a.equals(2) && context.d.equals(4),
      'a && b == 1 || a && c == 2 && c == 4 || !a && a == 2 && d == 4',
    ],
  ];

  const clause = when(context =>
    context.a.truthy()
      ? context.b.equals(1) || (context.c.equals(2) && context.c.equals(4))
      : context.a.equals(2) && context.d.equals(4),
  );
  expect(clause.compile()).toBe('a && b == 1 || a && c == 2 && c == 4 || !a && a == 2 && d == 4');

  for (const [fn, expected] of ttable) {
    test(expected, () => expect(when(fn).compile()).toEqual(expected));
  }

  it('allows using typed keys', () => {
    const c = new Contributions();
    const hello = c.contextKey('hello');
    expect(when(() => hello.equals('world')).compile()).to.equal('hello == world');
  });
});
