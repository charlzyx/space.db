/* eslint-disable react/prop-types */
import React, {
  PureComponent, createContext, forwardRef, useState, useEffect, useRef,
} from 'react';
import hoistStatics from 'hoist-non-react-statics';
import produce from 'immer';
import shallowequal from 'shallowequal';
import _ from 'lodash';
import _castPath from 'lodash/_castPath';


const isType = (o, t) => Object.prototype.toString.call(o) === `[object ${t}]`;

const SpaceCtx = createContext({});

// https://stackoverflow.com/questions/53446020/how-to-compare-oldvalues-and-newvalues-on-react-hooks-useeffect
const usePrevious = (value) => {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

const noop = () => {};

const Space = (props) => {
  const {
    with: ctx, state, setState, value, onChange, effect, children,
  } = props;

  const val = (ctx && ctx[0]) || (ctx && ctx.state) || (ctx && ctx.value)
    || state || value || {};
  const set = (ctx && ctx[1]) || (ctx && ctx.setState) || (ctx && ctx.onChange)
    || setState || onChange || noop;
  const change = set.bind(ctx);

  if (!isType(value, 'Undefined') && !isType(val, 'Object') && !isType(val, 'Array')) {
    throw new Error('[Space] value 类型只能是 plain Object 或 array');
  }

  const [store, putStore] = useState(val);
  const prevStore = usePrevious(store);
  const prevV = usePrevious(val);
  const put = (next) => {
    change(next);
    putStore(next);
  };

  useEffect(() => {
    // 外部更新
    // 如果 props.value 变化, 并且新的 value 跟 store 不相等, 更新 store, 触发change
    if (!shallowequal(prevV, val) && !shallowequal(val, store)) {
      putStore(val);
    }

    // 内部更新
    // 如果 props.value 没有变化, 但是 store 跟 props.value 不再相等, 触发change
    if (shallowequal(prevV, val) && !shallowequal(val, store)) {
      change(store);
    }
    // store 有变化, effect
    if (!shallowequal(prevStore, store) && prevStore) {
      effect(store);
    }
  }, [val, store]);

  return (
    <SpaceCtx.Provider value={{
      store,
      put,
    }}
    >
      {children}
    </SpaceCtx.Provider>
  );
};

const handleInput = input => (input ? (Array.isArray(input) ? input : [input]) : []);
const handleOutput = output => (output ? (Array.isArray(output) ? output : [output]) : []);

const Atomic = (Comp) => {
  class AtomicBox extends PureComponent {
    lastChange = '__INIT__';

    renderComp = (ctx) => {
      const { store, put } = ctx;
      const {
        vm, forwardRef: ref, input, output, onChange = noop,
      } = this.props;
      const inputPipes = handleInput(input);
      const outputPipes = handleOutput(output);

      const path = _castPath(vm);
      const value = inputPipes.reduce((v, pipe) => pipe(v), _.get(store, path));

      let change;
      if (onChange) {
        change = (v) => {
          const after = outputPipes.reduce((nv, pipe) => pipe(nv), v);
          let next;
          try {
            next = produce(store, (draftStore) => { // eslint-disable-line
              _.set(draftStore, path, after);
            });
          } catch (error) {
            console.error('[Space] set immer produce error\n', error);
            next = _.cloneDeep(store);
            _.set(next, path, after);
          } finally {
            put(next);
            onChange(next);
            this.lastChange = after;
          }
        };
      }
      if (!shallowequal(this.lastChange, value)) {
        if (this.lastChange !== '__INIT__') {
          change(value);
        }
        this.lastChange = value;
      }

      const nextProps = {
        ...this.props,
        ref,
        value,
        onChange: change,
      };
      delete nextProps.forwardRef;

      return (
        <Comp {...nextProps} />
      );
    }

    render() {
      return (
        <SpaceCtx.Consumer>
          {this.renderComp}
        </SpaceCtx.Consumer>
      );
    }
  }
  const ForwardAtomicBox = forwardRef((props, ref) => <AtomicBox {...props} forwardRef={ref} />);
  hoistStatics(ForwardAtomicBox, Comp);
  return ForwardAtomicBox;
};


export {
  Space,
  Atomic,
};
