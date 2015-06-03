'use strict';

import assert from 'power-assert';
import combineTemplate from '../src/index';
import Rx from 'rx-lite';

describe('rx.observable.combineTemplate', ()=> {

  it('empty', () => {
    let observable = combineTemplate({});
    observable.subscribe(() => {});
  });

  it('falsy value', () => {
    let observable = combineTemplate({
      foo : null,
      bar : undefined
    });
    observable.subscribe(() => {});
  });

  it('object', (done) => {
    let subject = new Rx.Subject();
    let observable = combineTemplate({
      foo  : 'bar',
      test : subject
    });

    observable.subscribe((v) => {
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
    let subject2 = new Rx.Subject();
    let subject3 = new Rx.Subject();

    let observable = combineTemplate({
      test : [subject1, subject2, subject3],
      qux  : 'c⌒っ.ω.)っ'
    });

    observable.subscribe((v) => {
      if (v != null) {
        assert(v.test[0] === 'foo');
        assert(v.test[1] === 'bar');
        assert(v.test[2] === 'baz');
        assert(v.qux === 'c⌒っ.ω.)っ');
        done();
      }
    });

    subject1.onNext('foo');
    subject2.onNext('bar');
    subject3.onNext('baz');
  });

  it('nested', (done) => {
    let subject1 = new Rx.Subject();
    let subject2 = new Rx.Subject();
    let subject3 = new Rx.Subject();

    let observable = combineTemplate({
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

    observable.subscribe((v) => {
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
    subject2.onNext('bar');
    subject3.onNext('qux');
  });

  it('twice', (done) => {
    let subject1 = new Rx.Subject();
    let subject2 = new Rx.Subject();

    let observable = combineTemplate({
      test : ['foo', subject1, 'baz'],
      qux  : subject2
    });

    observable.subscribe((v) => {
      if (v != null && v.qux === 'FOO') {
        assert(v.test[0] === 'foo');
        assert(v.test[1] === 'BAR');
        assert(v.test[2] === 'baz');
        assert(v.qux === 'FOO');
        subject2.onNext('END');
      }
      if (v != null && v.qux === 'END') {
        assert(v.test[0] === 'foo');
        assert(v.test[1] === 'BAR');
        assert(v.test[2] === 'baz');
        assert(v.qux === 'END');
        done();
      }
    });

    subject1.onNext('BAR');
    subject2.onNext('FOO');
  });
});
