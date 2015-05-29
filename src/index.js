'use strict';

var clone = require('clone-deep');
var Rx = require('rx-lite');

/**
 * Generate values  based on the Observable and object template.
 * Similar to `Bacon.combineTemplate`.
 *
 * ```
 *   var combineTemplate = require('rx.observable.combinetemplate')
 *
 *   // observables
 *   var password, username, firstname, lastname;
 *
 *   // combine and publish structure!
 *   var loginInfo = combineTemplate({
 *     magicNumber: 3,
 *     userid: username,
 *     passwd: password,
 *     name: { first: firstname, last: lastname }
 *   });
 *
 *   loginInfo.subscribe((v) => {
 *     console.log(v);
 *   });
 * ```
 *
 * @param {Object} templateObject
 * @returns {Rx.Observable}
 */
function combineTemplate(templateObject) {
  templateObject = templateObject || {};

  // TODO avoid clone `Rx.Observable`
  var clonedTemplate = clone(templateObject);
  var collections = collectTargetObservablesAndContext(templateObject);

  return Rx.Observable.combineLatest(
    collections.targets,
    createCombineObserver(collections.contexts, clonedTemplate)
  );
}

/**
 * @param {Array<Array<...number>>} targetContexts
 * @returns {Function}
 */
function createCombineObserver(targetContexts, baseObject) {
  var prevValues = [];
  var returnObject = baseObject;

  /**
   * produce object that observer function.
   *
   * @param {...Array<*>} values
   * @return Object
   */
  return function() {
    var newValues = Array.prototype.slice.call(arguments);

    // Compares the `newValues` and `prevValues` to confirm position has changed
    var changedArgPositions = newValues.map(function(value, i) {
      return prevValues.indexOf(i) !== value ? i : null;
    });

    // To update only the changed arguments
    changedArgPositions.forEach(function(i) {
      var newChangedArg = newValues[i];
      var targetContext = targetContexts[i].slice();
      var target = returnObject;

      // Continuous updating references to the one before the end of the `targetContext`
      while (targetContext.length > 1) {
        target = target[targetContext.shift()];
      }

      target[targetContext.shift()] = newChangedArg;
    });

    prevValues = newValues.slice();
    return returnObject;
  };
}

/**
 * Log target observable & context that indicates the position in the object.
 *
 * @param {Object} templateObject
 * @returns {{targets: Array, contexts: Array}}
 */
function collectTargetObservablesAndContext(templateObject) {
  var targets = [];
  var contexts = [];

  /**
   *
   * ```
   *   // context index sample (`x` == Observable)
   *   {
   *     foo: x, // => ['foo']
   *     bar: {
   *       foo: x, // => ['bar', 'foo']
   *       bar: [_, _, x]  // => ['bar', 'bar', 2]
   *     },
   *     baz: [_, x, _], // => ['baz', 1]
   *     qux: {
   *       foo: {
   *         foo: x // => ['qux', 'foo', 'foo']
   *       }
   *     }
   *   }
   * ```
   *
   * @param {Array<*>|Object<*>} list
   * @param {Array<Array<number|string>>} parentContext like [0, 3, 2...]
   */
  function walker(list, parentContext) {

    if (Array.isArray(list)) {
      list.forEach(evaluator);
    } else {
      Object.keys(list).forEach(function(key) {
        evaluator(list[key], key);
      });
    }

    function evaluator(value, key) {
      var context = parentContext.slice();
      context.push(key);

      // isObservable(?)
      if (value.isDisposed != null && value.isStopped != null) {
        targets.push(value);
        contexts.push(context);

        // isArray || isObject
      } else if (Array.isArray(value) || (typeof value === 'object' && !!value)) {
        walker(value, context);
      }
    }
  }

  walker(templateObject, []);

  return {
    targets  : targets,
    contexts : contexts
  };
}

module.exports = combineTemplate;
