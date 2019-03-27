/* eslint-disable react/prop-types */
/**
 * space.db
 *
 * [Space] 仰望星空 | https://www.nasa.gov
 * [Space] 与脚踏实地, 看看键盘上最大的是什么键 | http://spacemacs.org
 * [Space] namespace | 数据模块化的一种视觉暗示
 */
import React, {
  PureComponent, createContext, forwardRef, useState, useEffect, useRef,
} from 'react';
import hoistStatics from 'hoist-non-react-statics';
import produce from 'immer';
import shallowequal from 'shallowequal';
import _ from 'lodash';
import _castPath from 'lodash/_castPath';

/**
 * 判断给定值是否是给定类型;
 * ------------------------------------------------------------
 *  (any, Type) => bool
 */
const isType = (o, t) => Object.prototype.toString.call(o) === `[object ${t}]`;
/**
 * 判断是否是 Promise like;
 * ------------------------------------------------------------
 *  (p) => bool
 */

const isThenable = p => (typeof p.then === 'function');

/**
 * 膜法: 这是为什么导出一对 <Space />, <Atomic /> 就够用的原因;
 * ------------------------------------------------------------
 * () => SpaceCtx
 */
const SpaceCtx = createContext({});

/**
 * hook: usePrevious 获取上次 run 的值
 * ------------------------------------------------------------
 * <<面向 stackoverflow 编程>>
 * https://stackoverflow.com/questions/53446020/how-to-compare-oldvalues-and-newvalues-on-react-hooks-useeffect
 */
const usePrevious = (value) => {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

/**
 * noop is noop, 就是什么都不做的空函数
 * ------------------------------------------------------------
 * () => void
 */
const noop = () => {};

/**
 * 裁决刃.国肠! emmmm... 其实就是校验函数本体
 * ------------------------------------------------------------
 * (v, rules) => reason;
 * - rule
 * 返回的是 falsely 就被认为是通过, 即[没有消息就是最好的消息]
 * 如果是 Promise 的话, then 认为是通过, catch 是不通过, 同时
 * String: reject reason 会被作为 reason
 */
const ruling = (v, rules) => rules.reduce((reason, rule) => {
  if (reason) return reason;
  return rule(v);
}, null);
// 异步校验 FLAG
ruling.WAITING = '校验中...';

/**
 * Space
 * ------------------------------------------------------------
 * - with // 响应数据源, 是 state, setState; value, onChange 的语法糖, 支持一下三种形式
 *  - { state, setState }
 *  - [ state, setState ]
 *  - { value, onChange }
 * --------------
 * - state? 数据源 getter
 * - setState? 数据源 setter
 * --------------
 * - value? 数据源 getter
 * - onChange? 数据源 setter
 * --------------
 * - effect? 副作用, Space 数据变动回调函数
 * --------------
 * - ruler? 校验 refer, 便于使用
 *  - rule 虽然是个Promise, 但是只是取当前的校验结果, 比如是 reset 之后的, 那么就并不准确, 考虑废弃掉
 *    (path?) => Promise<reason> // 不指定 path 就是校验全部
 *  - ruling 异步方法, 会再次执行一次校验之后给出结果
 *    (path?) => Promise<reason> // 不指定 path 就是校验全部
 *  - clear 重置校验状态
 *    (path?) => void // 不指定 path 就是重置全部
 * --------------
 * - discover?
 *  - put 设置 Space 中的 store, immer producer
 *    (producer) => Promise<next>
 *    -  producer
 *      (draft) => void | nextDraft | next;
 *  - got 获取 Space store 的值, 同步方法,跟 setState 一样, 可能获取到的是旧的
 *    () => store
 *    - got.next 获取最新的 Space store, 其实吧, 就是个 setTimeout
 *      () => Promise<next>
 * --------------
 * - children React.Element
 */
const Space = (props) => {
  const {
    // 成吨的语法糖
    with: ctx, state, setState, value, onChange,
    // 副作用
    effect,
    // 校验 refer
    ruler,
    // got / put refer
    discover,
    // jack son
    children,
  } = props;

  const val = (ctx && ctx[0]) || (ctx && ctx.state) || (ctx && ctx.value)
    || state || value || {};
  const set = (ctx && ctx[1]) || (ctx && ctx.setState) || (ctx && ctx.onChange)
    || setState || onChange || noop;
  const change = set.bind(ctx);

  /**
   * TODO: 一波参数校验
   */

  if (!isType(value, 'Undefined') && !isType(val, 'Object') && !isType(val, 'Array')) {
    throw new Error('[Space] value 类型只能是 plain Object 或 array');
  }

  // Hooks Show Time !

  /**
   * hook: store 核心数据 store, putStore
   */
  const [store, putStore] = useState(val);
  /**
   * hook: init 初始值, 第一次不为空的 store将被认为是 初始值
   */
  const [init, putInit] = useState();
  /**
   * hook: rules 校验结果集, 数组
   * ------------------------------------------------------------
   * rules
   * { path: [path] ,
   *   rules: [],
   *   reason: null | msg | true ,
   * }
   */
  const [rules, putRule] = useState([]);
  /**
   * hook: 上次的store, 方便下方完成 store 对比来看是否触发 effect
   */
  const prevStore = usePrevious(store);
  /**
   * hook: 上次 props.value, 通过对比来看是否要更新 space store
   */
  const prevV = usePrevious(val);

  /**
   * 对 putStore 方法的包装, 来更早的触发一次 change, 这样 useEffect 里面再对比就是有效数据了
   */
  const put = (next) => {
    change(next);
    putStore(next);
  };

  /**
   * 保存初始值, 给 reset 用
   */
  if (!init && store) {
    putInit(_.cloneDeep(store));
  }

  /**
   * discover refer处理
   * ------------------------------------------------------------
   * 事实上,这里可能用 ref 来优化掉每次都生产新函数
   * 但是我太菜了, 还不会
   */
  if (discover && init) {
    discover.got = () => store;

    discover.reset = (manualInit, wait = 0) => new Promise((resolve) => {
      put(manualInit || init);
      setTimeout(() => {
        resolve(discover.got());
      }, wait);
    });

    discover.put = (next, wait = 0) => new Promise((resolve) => {
      put(produce(store, (draft) => { // eslint-disable-line
        const after = typeof next === 'function' ? next(draft) : next;
        if (after !== undefined) {
          return after;
        }
      }));
      setTimeout(() => {
        resolve(discover.got());
      }, wait);
    });
    discover.got.next = (wait = 0) => new Promise((resolve) => {
      setTimeout(() => {
        resolve(discover.got());
      }, wait);
    });
  }

  /**
   * ruler 处理
   * ------------------------------------------------------------
   * > 1789年7月14日,法国国王路易十六在日记中写下“今日无事”。
   *
   * I used rule the world.
   *    -- Viva La Vida.
   *
   * 异步的情况处理起来颇为繁琐, 代码还有待优化
   */
  if (ruler && !ruler.getMap) {
    ruler.getRules = () => rules;
    ruler.putRule = putRule;
    ruler.ruling = (path) => {
      const castPath = _castPath(path);
      if (path) {
        const rule = rules.find(r => shallowequal(r.path, castPath));
        return new Promise((resolve, reject) => {
          try {
            const reason = ruling(_.get(store, path), rule.rules);
            /**
             * 为了异步的校验, 同步的校验也要包装称为 Promise
             */
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
              /**
               * 异步校验, 先更新下UI, I promise
               */
              putRule(produce((all) => {
                const myRule = all.find(r => shallowequal(r.path, castPath));
                myRule.reason = ruling.WAITING;
              }));
              /**
               * 真正的结果回来了, I have promised.
               */
              reason.then((nextReason) => {
                putRule(produce((all) => {
                  const myRule = all.find(r => shallowequal(r.path, castPath));
                  /**
                   * 来晚了, 以及被小老弟 clear 清理掉了
                   */
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
                  /**
                   * 来晚了, 以及被小老弟 clear 清理掉了
                   */
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
          /**
           * 到这里, 应该也就校验方法报错能跑到这里了
           */
            reject(error);
          }
        });
      }

      /**
       * 通过 Promise.all 包装起来的上面的校验, 一样的逻辑, 所以这里需要优化,
       * 稍微有点不同的是, 这里的 reason 会是个数组
       */
      return Promise.all(rules.map(rule => new Promise((resolve, reject) => {
        try {
          const reason = ruling(_.get(store, rule.path), rule.rules);
          /**
           * 为了异步的校验, 同步的校验也要包装称为 Promise
           */
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
            /**
             * 异步校验, 先更新下UI, I promise
             */
            putRule(produce((all) => {
              const myRule = all.find(r => shallowequal(r.path, rule.path));
              myRule.reason = ruling.WAITING;
            }));
            /**
             * 真正的结果回来了, I have promised.
             */
            reason.then((nextReason) => {
              putRule(produce((all) => {
                const myRule = all.find(r => shallowequal(r.path, rule.path));
                /**
                 * 来晚了, 以及被小老弟 clear 清理掉了
                 */
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
                /**
                 * 来晚了, 以及被小老弟 clear 清理掉了
                 */
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
        /**
         * 到这里, 应该也就校验方法报错能跑到这里了
         */
          console.error(error);
          reject(error);
        }
      })));
    };
  }

  /**
   * hook: useEffect space.store ⇋ outside.value
   * ------------------------------------------------------------
   * 同步内部 store 和 外部 value | state
   */
  useEffect(() => {
    /**
     * 外部更新触发的内部 store 更新
     * 如果 props.value 变化, 并且新的 value 跟 store 不相等, 更新 store, 触发change
     */
    if (!shallowequal(prevV, val) && !shallowequal(val, store)) {
      putStore(val);
    }

    /**
     * FIXME: 好像跟 上方 put 重复了
     * 内部 store 更新触发的外部更新
     * 如果 props.value 没有变化, 但是 store 跟 props.value 不再相等, 触发change
     */
    // if (shallowequal(prevV, val) && !shallowequal(val, store)) {
    //   console.log('inner change');
    //   change(store);
    // }
    /**
     * store 有变化, effect
     */
    if (!shallowequal(prevStore, store) && prevStore) {
      effect(store);
    }
  }, [val, store]);

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

/**
 * io 管道语法糖处理
 * ------------------------------------------------------------
 * - handleInput
 *  (input, io) = InputPipe[]
 * - handleOutput
 *  (output, io) => OutputPipe[]
 */
const handleInput = (input, io) => (io ? io.map(pair => pair[0])
  : (input ? (Array.isArray(input) ? input : [input]) : []));
const handleOutput = (output, io) => (io ? io.map(pair => pair[1])
  : (output ? (Array.isArray(output) ? output : [output]) : []));

/**
 * Atomic 原子组件:
 * 如果一个组件像下方这个 Input 这样, 拥有 value/onChange 属性,
 * 并且 onChange 只对 value 做了set, 那么, 我们称之为 [原子组件]
 *
 * const Input = (props) => <input
  *  {...props}
  *  onChange=(e) => {
  *    props.onChange(e.target.value);
  *  }
  * />
 * ------------------------------------------------------------
 * - vm 像 vue v-model 一样的语法, 表示在当前 store 中的路径
 *  stirng | path[] // 参考 lodash 所支持的 path 格式
 * --------------
 * - v 跟 vm 类似, 不同的是, 会被认为是没有 onChange 的只读类型
 *  stirng | path[] // 参考 lodash 所支持的 path 格式
 * --------------
 * - io 成对出现的 [input, output] 过滤器, 考虑到成对出现的特性,提出来的语法糖
 *  [input, output][]
 * --------------
 * - input 对获取到的 value 的处理管道函数
 *  (v) => next
 * --------------
 * - output 对 onChange 的参数 next 的处理管道函数
 *  (next) => nextnext
 * --------------
 * - onChange 事实上, 就只是 onEffect 的作用了, 只是监听了变动, 不期望在此处做修改
 *  (next) => void
 * --------------
 * - rules 校验规则集, 数组, 函数
 *  (v) => null | reason | Promise<null | reason>[]
 * --------------
 * - forwradRef 参考 React.forwardRef 示例
 */
const Atomic = (Comp) => {
  class AtomicBox extends PureComponent {
    lastChange = '__INIT__';

    renderComp = (ctx) => {
      const {
        store, put, rules: allRules, putRule,
      } = ctx;
      const {
        vm, v: readonlyPath, forwardRef: ref, input, output, onChange = noop, rules, io,
      } = this.props;

      /**
       * io 管道处理
       */
      const inputPipes = handleInput(input, io);
      const outputPipes = handleOutput(output, io);

      /**
       * path 处理
       */
      const path = _castPath(vm || readonlyPath);
      /**
       * 使用 input 管道们, 对值做处理
       */
      const value = inputPipes.reduce((v, pipe) => pipe(v), _.get(store, path));

      /**
       * 有 vm 才有 change, 否则就是只读
       */
      let change;
      if (vm) {
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
            // 调用 putStore 并触发自己的 onChange
            put(next);
            onChange(next);
            this.lastChange = after;
          }
          // 漫长并略微复杂的校验处理
          if (allRules && rules) {
            let wali = ruling(after, rules);
            // 我上面说过什么来着, 异步就是难受
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
            // 同步
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
      // 如果是 外部 的setState或者discover.put 触发的change, 这里也要判断出来, 并触发
      if (vm && !shallowequal(this.lastChange, value)) {
        if (change && this.lastChange !== '__INIT__') {
          change(value);
        }
        this.lastChange = value;
      }

      const nextProps = {
        ...this.props,
        ref,
        value,
      };
      // 只读就是在这里做的
      if (vm) {
        nextProps.onChange = change;
      }
      // 在某次 rules 变更触发的更新中, 查询自己的 reason
      const has = vm && allRules && allRules.find(rule => shallowequal(rule.path, path));
      if (has) {
        nextProps.wali = has.reason;
      }

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
  /**
   * 傻傻的 forwardRef 和 hoistStatics
   */
  const ForwardAtomicBox = forwardRef((props, ref) => <AtomicBox {...props} forwardRef={ref} />);
  hoistStatics(ForwardAtomicBox, Comp);
  return ForwardAtomicBox;
};

/**
 * 校验 refer 的优化使用方式
 */
const ruler = () => ({
  /**
   * 内部方法, 获取当前校验集合
   */
  getRules: null,
  /**
   * 内部方法, 设置当前校验结果
   */
  putRule: null,
  /**
   * 异步校验方法
   */
  ruling: null,
  /**
   * 异步, 但是是获取当前实时校验结果
   */
  rule(path) {
    const { getRules } = this;
    const rules = getRules();
    let reason;
    if (path) {
      reason = rules.find(rule => shallowequal(rule.path, _castPath(path)));
    }
    const has = rules.find(rule => !rule.reason);
    reason = has ? has.reason : has;
    return reason ? Promise.reject(reason) : Promise.resolve();
  },
  /**
   * 清空当前校验结果
   */
  clear(path) {
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

// 异步校验, 校验中... 标记, 展示用
ruler.WAITING = ruling.WAITING;

const discover = () => ({
  put: null,
  got: null,
  reset: null,
});

export {
  Space,
  Atomic,
  ruler,
  discover,
};
