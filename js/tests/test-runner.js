// test-runner.js
// A tiny tool for checking that the game rules work, with no libraries.
//
// How to write a test (in any *.test.js file):
//   Game.test('what this checks, in plain words', function (t) {
//     t.equal(2 + 2, 4);                    // passes if the two values are the same
//     t.ok(5 > 3, 'five is bigger');        // passes if the value is true
//   });
//
// tests.html calls Game.runTests() at the end, which runs every test and lists the
// results on the page in green (pass) or red (fail).

window.Game = window.Game || {};

Game._tests = []; // Every test registered with Game.test, in order

// Registers a test to be run later.
Game.test = function (name, fn) {
  Game._tests.push({ name: name, fn: fn });
};

// Runs every registered test and draws the results into the page.
Game.runTests = function () {
  var results = [];

  Game._tests.forEach(function (test) {
    var failures = [];

    // The "t" helper each test receives. Each check records a failure instead of stopping the test.
    var t = {
      equal: function (actual, expected, note) {
        if (actual !== expected) {
          failures.push((note ? note + ': ' : '') + 'expected ' + JSON.stringify(expected) +
            ' but got ' + JSON.stringify(actual));
        }
      },
      // Like equal, but for objects and lists: passes if both have the same contents.
      sameContents: function (actual, expected, note) {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          failures.push((note ? note + ': ' : '') + 'the two objects have different contents');
        }
      },
      ok: function (value, note) {
        if (!value) {
          failures.push(note || 'expected something true but got ' + JSON.stringify(value));
        }
      }
    };

    try {
      test.fn(t);
    } catch (error) {
      // The test crashed. Count it as a failure and show the error message.
      failures.push('crashed: ' + error.message);
    }

    results.push({ name: test.name, passed: failures.length === 0, failures: failures });
  });

  Game._drawTestResults(results);
  return results;
};

// Puts the summary and the list of tests on the page.
Game._drawTestResults = function (results) {
  var passedCount = results.filter(function (r) { return r.passed; }).length;
  var failedCount = results.length - passedCount;

  var summary = document.getElementById('summary');
  summary.textContent = passedCount + ' passed, ' + failedCount + ' failed';
  summary.className = failedCount === 0 ? 'summary summary--pass' : 'summary summary--fail';

  var list = document.getElementById('results');
  results.forEach(function (r) {
    var item = document.createElement('li');
    item.className = r.passed ? 'test test--pass' : 'test test--fail';
    item.textContent = (r.passed ? 'PASS  ' : 'FAIL  ') + r.name;

    r.failures.forEach(function (message) {
      var detail = document.createElement('div');
      detail.className = 'test__detail';
      detail.textContent = message;
      item.appendChild(detail);
    });

    list.appendChild(item);
  });
};
