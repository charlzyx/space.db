import React, { useState, useEffect, PureComponent } from 'react';
import { atom } from './atom.io';

// event to value a
const eva = e => e.target.value;

const [got, put, Atomic] = atom();

const UseApp = () => {
  const [state, setState] = useState({
    query: {
      name: '',
      age: '',
    },
  });
  useEffect(() => {
    console.log('effect', state);
  });
  return (
    <Atomic ctx={{ state, setState }}>
      <div>
        <h1>Hello, Atomic</h1>
        <input
          vm="query.name"
          onChange={eva}
          type="text"
        />
        <input
          onChange={eva}
          vm="query.age"
          type="text"
        />

        <button
          onClick={() => {
            console.log('log got', got());
            got.next().then((next) => {
              console.log('log got.next', next);
            });
          }}
          type="button"
        >
            log
        </button>
        <button
          onClick={() => {
            put((data) => {
                data.query.age++; // eslint-disable-line
            }).then((next) => {
              console.log('put next', next);
            });
            console.log('now dealy got', got());
            console.log('now dealy state', state);
            got.next().then((next) => {
              console.log('got next', next);
            });
            setTimeout(() => {
              console.log('delay state', state);
              console.log('delay got', got());
            });
          }}
          type="button"
        >
            put test
        </button>
      </div>
    </Atomic>
  );
};

class App extends PureComponent {
  state = {
    query: {
      name: '',
      age: '',
    },
  };

  render() {
    console.log('render', this.state);
    return (
      <Atomic ctx={this}>
        <div>
          <h1>Hello, Atomic</h1>
          <input
            vm="query.name"
            onChange={eva}
            type="text"
          />
          <input
            onChange={eva}
            vm="query.age"
            type="text"
          />

          <button
            onClick={() => {
              console.log('log got', got());
              got.next().then((next) => {
                console.log('log got.next', next);
              });
            }}
            type="button"
          >
            log
          </button>
          <button
            onClick={() => {
              put((state) => {
                state.query.age++; // eslint-disable-line
              }).then((next) => {
                console.log('put next', next);
              });
              console.log('now dealy got', got());
              console.log('now dealy state', this.state);
              got.next().then((next) => {
                console.log('got next', next);
              });
              setTimeout(() => {
                console.log('delay state', this.state);
                console.log('delay got', got());
              });
            }}
            type="button"
          >
            put test
          </button>
        </div>
      </Atomic>
    );
  }
}

export default () => (
  <div>
    <App />
    <UseApp />
  </div>
);
