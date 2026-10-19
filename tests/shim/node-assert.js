// Minimal node:assert/strict shim for tests/browser.html.
const fail = (m) => { throw new Error(m); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const assert = (v, m) => v || fail(m || 'assert failed');
assert.ok = assert;
assert.equal = (a, b) => Object.is(a, b) || fail(`${JSON.stringify(a)} !== ${JSON.stringify(b)}`);
assert.deepEqual = (a, b) => same(a, b) || fail(`${JSON.stringify(a)} !deepEqual ${JSON.stringify(b)}`);
assert.match = (s, re) => re.test(s) || fail(`${s.slice(0, 80)} !~ ${re}`);
assert.doesNotMatch = (s, re) => !re.test(s) || fail(`${s.slice(0, 80)} =~ ${re}`);
assert.throws = (fn, re) => { try { fn(); } catch (e) { return re && !re.test(e.message) ? fail(`threw "${e.message}" !~ ${re}`) : true; } fail('did not throw'); };
export default assert;
