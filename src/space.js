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
const isThenable = p => (typeof p.then === 'function');

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

// 裁决刃.国肠
const ruling = (v, rules) => rules.reduce((reason, rule) => {
  if (reason) return reason;
  return rule(v);
}, null);

ruling.WAITING = '校验中...';

const Space = (props) => {
  const {
    // 成吨的语法糖
    with: ctx, state, setState, value, onChange,
    // 副作用
    effect,
    // jack son
    children,
    // 校验 refer
    ruler,
    // got / put refer
    disover,
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
   * rules
   * { path: [path] ,
   *   rules: [],
   *   reason: null | msg | true ,
   * }
   */
  const [rules, putRule] = useState([]);
  const prevStore = usePrevious(store);
  const prevV = usePrevious(val);
  const put = (next) => {
    change(next);
    putStore(next);
  };

  if (ruler && !ruler.getMap) {
    /**
     * I used rule the world.
     *    -- Viva La Vida.
     *
     * 1789年7月14日,法国国王路易十六在日记中写下“今日无事”。
     */
    ruler.getRules = () => rules;
    ruler.putRule = putRule;
    ruler.ruling = (path) => {
      const castPath = _castPath(path);
      if (path) {
        const rule = rules.find(r => shallowequal(r.path, castPath));
        return new Promise((resolve, reject) => {
          try {
            const reason = ruling(_.get(store, path), rule.rules);
            // 所以同步就是省心啊
            if (!isThenable(reason)) {
              putRule(produce((all) => {
                const myRule = all.find(r => shallowequal(r.path, castPath));
                myRule.reason = reason;
              }));
              if (reason) {
                reject(reason);
              } else {
                resolve();
              }
            } else {
              // 难受的异步
              // 先更新下UI
              putRule(produce((all) => {
                const myRule = all.find(r => shallowequal(r.path, castPath));
                myRule.reason = ruling.WAITING;
              }));
              // 异步 fq
              reason.then((nextReason) => {
                putRule(produce((all) => {
                  const myRule = all.find(r => shallowequal(r.path, castPath));
                  // 被外部手动取消了
                  if (myRule.reason === null) {
                    resolve();
                    return;
                  }
                  myRule.reason = nextReason;
                  if (nextReason) {
                    reject(nextReason);
                  } else {
                    resolve();
                  }
                }));
              }).catch((e) => {
                putRule(produce((all) => {
                  const myRule = all.find(r => shallowequal(r.path, castPath));
                  // 被外部手动取消了
                  if (myRule.reason === null) {
                    resolve();
                    return;
                  }
                  myRule.reason = e || 'RULING_HTTP_ERROR';
                  reject(myRule.reason);
                }));
              });
            }
          } catch (error) {
            console.error(error);
            reject(error);
          }
        });
      }

      // 还有比异步更恶心的玩意吗? 当然, 循环异步
      return Promise.all(rules.map(rule => new Promise((resolve, reject) => {
        try {
          const reason = ruling(_.get(store, rule.path), rule.rules);
          // 所以同步就是省心啊
          if (!isThenable(reason)) {
            putRule(produce((all) => {
              const myRule = all.find(r => shallowequal(r.path, rule.path));
              myRule.reason = reason;
            }));
            if (reason) {
              reject(reason);
            } else {
              resolve();
            }
          } else {
            // 难受的异步
            // 先更新下UI
            putRule(produce((all) => {
              const myRule = all.find(r => shallowequal(r.path, rule.path));
              myRule.reason = ruling.WAITING;
            }));
            // 异步 fq
            reason.then((nextReason) => {
              putRule(produce((all) => {
                const myRule = all.find(r => shallowequal(r.path, rule.path));
                // 被外部手动取消了
                if (myRule.reason === null) {
                  resolve();
                  return;
                }
                myRule.reason = nextReason;
                if (nextReason) {
                  reject(nextReason);
                } else {
                  resolve();
                }
              }));
            }).catch((e) => {
              putRule(produce((all) => {
                const myRule = all.find(r => shallowequal(r.path, rule.path));
                // 被外部手动取消了
                if (myRule.reason === null) {
                  resolve();
                  return;
                }
                myRule.reason = e || 'RULING_HTTP_ERROR';
                reject(myRule.reason);
              }));
            });
          }
        } catch (error) {
          console.error(error);
          reject(error);
        }
      })));
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
  }, [val, store, rules]);

  return (
    <SpaceCtx.Provider value={{
      store,
      put,
      rules: ruler ? rules : false,
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
        store, put, rules: allRules, putRule,
      } = ctx;
      const {
        vm, forwardRef: ref, input, output, onChange = noop, rules,
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
          if (allRules && rules) {
            let wali = ruling(after, rules);
            if (isThenable(wali)) {
              wali.then((nextWali) => {
                putRule(produce((all) => {
                  const myRule = all.find(rule => shallowequal(rule.path, path));
                  // 表明是被重置掉了, 就不在管了
                  if (!myRule.reason === null) return;
                  myRule.rules = rules;
                  myRule.reason = nextWali;
                }));
              }).catch((e) => {
                putRule(produce((all) => {
                  const myRule = all.find(rule => shallowequal(rule.path, path));
                  // 表明是被重置掉了, 就不在管了
                  if (!myRule.reason === null) return;
                  myRule.rules = rules;
                  myRule.reason = e || 'RULING_HTTP_FAILED';
                }));
              });
              wali = ruling.WAITING;
            }
            putRule(produce((all) => {
              const myRule = all.find(rule => shallowequal(rule.path, path));
              if (myRule) {
                myRule.rules = rules;
                myRule.reason = wali;
              } else {
                all.push({ rules, reason: wali, path });
              }
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
      const has = allRules.find(rule => shallowequal(rule.path, path));
      if (has) {
        nextProps.wali = has.reason;
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
  getRules: null,
  putRule: null,
  ruling: null,
  rule(path) {
    const { getRules } = this;
    const rules = getRules();
    let reason;
    if (path) {
      reason = rules.find(rule => shallowequal(rule.path, _castPath(path)));
    }
    const has = rules.find(rule => rule.reason !== null);
    reason = has ? has.reason : has;
    return reason ? Promise.reject(reason) : Promise.resolve();
  },
  reset(path) {
    const { putRule, getRules } = this;
    const rules = getRules();
    if (path) {
      putRule(produce(rules, (rs) => { // eslint-disable-line
        for (let i = 0; i <= rules.length; i++) { // eslint-disable-line
          const rule = rules[i];
          if (shallowequal(rule.path, _castPath(path))) {
            rule.reason = null;
            return rs;
          }
        }
      }));
    } else {
      putRule(produce(rules, (rs) => {
        rs.forEach((rule) => {
          rule.reason = null;
        });
      }));
    }
  },
});

ruler.WAITING = ruling.WAITING;

export {
  Space,
  Atomic,
  ruler,
};
