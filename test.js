'use strict';

import assert from 'power-assert';
import combineTemplate from './';
import Rx from 'rx-lite';

describe('rx.observable.combineTemplate', ()=> {

  it('empty', () => {
    let combined = combineTemplate({});
    combined.subscribe(() => {});
  });

  it('falsy value', () => {
    let combined = combineTemplate({
      foo : null,
      bar : undefined
    });
    combined.subscribe(() => {});
  });

  it('object', (done) => {
    let subject = new Rx.Subject();
    let combined = combineTemplate({
      foo  : 'bar',
      test : subject
    });

    combined.subscribe((v) => {
      if (v.test != null) {
        assert(v.foo === 'bar');
        assert(v.test === 'baz');
        done();
      }
    });

    subject.onNext('baz');
  });

  it('array', (done) => {
    let subject1 = new Rx.Subject();
    let observable = new Rx.Observable.just('bar');
    let subject2 = new Rx.Subject();

    let combined = combineTemplate({
      test : [subject1, observable, subject2],
      qux  : 'c⌒っ.ω.)っ'
    });

    combined.subscribe((v) => {
      if (v != null) {
        assert(v.test[0] === 'foo');
        assert(v.test[1] === 'bar');
        assert(v.test[2] === 'baz');
        assert(v.qux === 'c⌒っ.ω.)っ');
        done();
      }
    });

    subject1.onNext('foo');
    subject2.onNext('baz');
  });

  it('nested', (done) => {
    let subject1 = new Rx.Subject();
    let observable = new Rx.Observable.just('bar');
    let subject2 = new Rx.Subject();

    let combined = combineTemplate({
      foo : 'bar',
      baz : {
        foo : {
          foo : subject1
        },
        bar : 'baz'
      },
      qux : {
        foo : [1, observable, 3],
        baz : subject2
      }
    });

    combined.subscribe((v) => {
      if (v != null) {
        assert(v.foo === 'bar');
        assert(v.baz.foo.foo === 'foo');
        assert(v.baz.bar === 'baz');
        assert(v.qux.foo[0] === 1);
        assert(v.qux.foo[1] === 'bar');
        assert(v.qux.foo[2] === 3);
        assert(v.qux.baz === 'qux');
        done();
      }
    });

    subject1.onNext('foo');
    subject2.onNext('qux');
  });

  it('twice', (done) => {
    let subject = new Rx.Subject();
    let observable = new Rx.Observable.just('FOO');

    let combined = combineTemplate({
      test : ['foo', subject, 'baz'],
      qux  : observable
    });

    combined.subscribe((v) => {
      if (v != null && v.test[1] === 'BAR') {
        assert(v.test[0] === 'foo');
        assert(v.test[1] === 'BAR');
        assert(v.test[2] === 'baz');
        assert(v.qux === 'FOO');
        subject.onNext('END');
      }
      if (v != null && v.test[1] === 'END') {
        assert(v.test[0] === 'foo');
        assert(v.test[1] === 'END');
        assert(v.test[2] === 'baz');
        assert(v.qux === 'FOO');
        done();
      }
    });

    subject.onNext('BAR');
  });
});
