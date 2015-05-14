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
        if (Array.isArray(target)) {
          target = target[targetContext.shift()];
        } else {
          target = target[Object.keys(target)[targetContext.shift()]];
        }
      }

      // Assign a new value
      if (Array.isArray(target)) {
        target[targetContext.shift()] = newChangedArg;
      } else {
        target[Object.keys(target)[targetContext.shift()]] = newChangedArg;
      }
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
   *   // context index sample
   *   {
   *     foo: 'a', // => [0]
   *     bar: {
   *       foo: 'a', // => [1, 0]
   *       bar: 'b'  // => [1, 1]
   *     },
   *     baz: 'b', // => [2]
   *     qux: {
   *       foo: {
   *         foo: 'a' // => [3, 0, 0]
   *       }
   *     }
   *   }
   * ```
   *
   * @param {Array<*>} values
   * @param {Array<Array<number>>} parentContext like [0, 3, 2...]
   */
  function walker(values, parentContext) {
    values.forEach(function(value, i) {
      var context = parentContext.slice();
      context.push(i);

      // isObservable(?)
      if (value.isDisposed != null && value.isStopped != null) {
        targets.push(value);
        contexts.push(context);

        // isArray
      } else if (Array.isArray(value)) {
        walker(value, context);

        // isObject
      } else if (typeof value === 'object' && !!value) {
        walker(extractValuesFromObject(value), context);
      }
    });
  }

  walker(extractValuesFromObject(templateObject), []);

  return {
    targets  : targets,
    contexts : contexts
  };
}

/**
 * Extract the object values as an array.
 *
 * @param {Object} object
 * @returns {Array<*>}
 */
function extractValuesFromObject(object) {
  return Object.keys(object).map(function(key) {
    return object[key];
  });
}

module.exports = combineTemplate;
