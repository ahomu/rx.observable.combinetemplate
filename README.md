# Rx.Observable.combineTemplate

Generate values  based on the Observable and object template. Similar to `Bacon.combineTemplate` ([link](https://github.com/baconjs/bacon.js#observable-combine)).

## Usage

### Install

```bash
npm install --save rx.observable.combinetemplate
```

### Basics

```javascript
import combineTemplate from 'rx.observable.combinetemplate';
import * as Rx from 'rx';

let subject1 = new Rx.Subject();
let subject2 = new Rx.Subject();

combineTemplate({
  foo : 'bar',
  baz : {
    foo : ['bar', subject1 'qux']
  },
  qux : {
    foo : {
     foo : 'bar'
     baz : subject2
    }
  }
}).subscribe((value)=> {
  console.log(value);
  /* === output ===
  {
    foo : 'bar',
    baz : {
      foo : ['bar', 'BAZ' 'qux']
    },
    qux : {
      foo : {
       foo : 'bar'
       baz : 'QUX'
      }
    }
  }
  */
});

subject1.onNext('BAZ');
subject2.onNext('QUX');
```

### with React

State is updated automatically receives a value from the observables.

```javascript
componentWillMount() {
  combineTemplate({
    items : store.itemsObservable$,
    count : store.itemsObservable$.map((items) => items.length)
  }).subscribe(this.setState.bind(this));
}
```

## Tests

```
npm test
```

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## License

MIT
