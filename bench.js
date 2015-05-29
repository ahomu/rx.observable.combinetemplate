var Benchmark = require('benchmark');
var Rx = require('rx-lite');
var before = require('./src/index');
var after = require('./src/changed');

var suite = new Benchmark.Suite();

// add tests
suite.add('before', {defer: true, fn: function(deferred) {
    var subject1 = new Rx.Subject();
    var subject2 = new Rx.Subject();
    var subject3 = new Rx.Subject();

    var observable = before({
      foo : 'bar',
      baz : {
        foo : {
          foo : subject1
        },
        bar : 'baz'
      },
      qux : {
        foo : [1, subject2, 3],
        baz : subject3
      }
    });

    observable.subscribe(function(v) {
      if (v != null) {
        deferred.resolve();
      }
    });

    subject1.onNext('foo');
    subject2.onNext('bar');
    subject3.onNext('qux');
  }})
  .add('after', {defer: true, fn: function(deferred) {
    var subject1 = new Rx.Subject();
    var subject2 = new Rx.Subject();
    var subject3 = new Rx.Subject();

    var observable = after({
      foo : 'bar',
      baz : {
        foo : {
          foo : subject1
        },
        bar : 'baz'
      },
      qux : {
        foo : [1, subject2, 3],
        baz : subject3
      }
    });

    observable.subscribe(function(v) {
      if (v != null) {
        deferred.resolve();
      }
    });

    subject1.onNext('foo');
    subject2.onNext('bar');
    subject3.onNext('qux');
  }})
  .on('cycle', function(event) {
    console.log(String(event.target));
  })
  .on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').pluck('name'));
  })
  .run({ 'async': true });
