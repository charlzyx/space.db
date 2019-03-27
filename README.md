![space.db](./logo.png)

# Space/DataBinding

> Two-Way DataBinding, for React.


> `overview`

```js
import { Space, Atomic, ruler, discover } from 'space.db';
```

> `<Space />`

```js
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

```

> `<Atomic />`


```js
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
```

> `ruler`

```jsx
/*
 * - ruler? 校验 refer, 便于使用
 *  - rule 虽然是个Promise, 但是只是取当前的校验结果, 比如是 reset 之后的, 那么就并不准确, 考虑废弃掉
 *    (path?) => Promise<reason> // 不指定 path 就是校验全部
 *  - ruling 异步方法, 会再次执行一次校验之后给出结果
 *    (path?) => Promise<reason> // 不指定 path 就是校验全部
 *  - clear 重置校验状态
 *    (path?) => void // 不指定 path 就是重置全
 */

const theRuler = ruler();
<Space ... ruler={theRuler}></Space>
```

> `discover`

```jsx
/*
 *  - put 设置 Space 中的 store, immer producer
 *    (producer) => Promise<next>
 *    -  producer
 *      (draft) => void | nextDraft | next;
 *  - got 获取 Space store 的值, 同步方法,跟 setState 一样, 可能获取到的是旧的
 *    () => store
 *    - got.next 获取最新的 Space store, 其实吧, 就是个 setTimeout
 *      () => Promise<next>
 */

const Discovery = discover();
<Space ... ruler={Discovery}></Space>
```


> `powered by`

- createContext
- React hooks
- immer.js.
