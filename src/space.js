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
const theRuler = (v, rules) => rules.reduce((result, rule) => {
  if (result) return result;
  return rule(v);
}, null);

theRuler.WAITING = '校验中...';
theRuler.HTTPFIELD = '校验失败';

const Space = (props) => {
  const {
    with: ctx, state, setState, value, onChange, effect, children, ruler,
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
  /**
   * rulesMap
   *  [path]: {
   *    rules: [],
   *    result: null,
   *  }
   */
  const [ruleMap, putRule] = useState({});
  const prevStore = usePrevious(store);
  const prevV = usePrevious(val);
  const put = (next) => {
    change(next);
    putStore(next);
  };

  if (ruler && !ruler.getMap) {
    // I used rule the world.
    ruler.getMap = () => ruleMap;
    ruler.putRule = putRule;
    ruler.rerule = () => {
      putRule(produce(ruleMap, (map) => {
        Object.keys(map).map().forEach((path) => {
          const v = _.get(store, JSON.parse(path));
          const { rules } = map[path];
          map[path].result = theRuler(v, rules);
        });
      }));
    };
  }

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
  }, [val, store, ruleMap]);

  return (
    <SpaceCtx.Provider value={{
      store,
      put,
      ruleMap: ruler ? ruleMap : false,
      putRule: ruler ? putRule : false,
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
      const {
        store, put, ruleMap, putRule,
      } = ctx;
      const {
        vm, forwardRef: ref, input, output, onChange = noop, rules,
      } = this.props;

      this.ruleMap = ruleMap;
      this.putRule = putRule;

      const inputPipes = handleInput(input);
      const outputPipes = handleOutput(output);

      const path = _castPath(vm);
      const vmStr = JSON.stringify(vm);
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
          if (ruleMap && rules) {
            const wali = theRuler(after, rules);
            putRule(produce((map) => {
              _.set(map, [vmStr, 'result'], wali);
              _.set(map, [vmStr, 'rules'], rules);
            }));
          }
        };
      }
      if (!shallowequal(this.lastChange, value)) {
        if (change && this.lastChange !== '__INIT__') {
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
      if (ruleMap && ruleMap[vmStr] && ruleMap[vmStr].result) {
        nextProps.wali = ruleMap[vmStr].result;
      }
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

const ruler = () => ({
  getMap: null,
  putRule: null,
  rerule: null,
  rule(path) {
    const { getMap } = this;
    let result;
    if (path) {
      result = getMap()[path].result; // eslint-disable-line
    }
    const map = getMap();
    const hasPath = Object.keys(map).find(p => map[p].result);
    result = hasPath ? map[hasPath].result : hasPath;
    return result ? Promise.reject(result) : Promise.resolve();
  },
  reset(path) {
    const { putRule, getMap } = this;
    const ruleMap = getMap();
    if (path) {
      putRule(produce(ruleMap, (map) => {
        map[path].result = null;
      }));
    } else {
      putRule(produce(ruleMap, (map) => {
        Object.entries(map).forEach((rule) => {
          rule.result = null;
        });
      }));
    }
  },
});

ruler.WAITING = theRuler.WAITING;
ruler.HTTPFIELD = theRuler.HTTPFIELD;

export {
  Space,
  Atomic,
  ruler,
};
