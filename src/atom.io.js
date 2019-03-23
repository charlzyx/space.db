/* eslint-disable react/prop-types, no-unused-vars */
import React, {
  forwardRef, createContext, PureComponent, SyntheticEvent,
} from 'react';
import PropTypes from 'prop-types';
import hoistNonReactStatics from 'hoist-non-react-statics';
import produce, {
  isDraft,
  isDraftable,
  createDraft,
  finishDraft,
} from 'immer';
import _ from 'lodash';
import _castPath from 'lodash/_castPath';

const isType = (o, t) => Object.prototype.toString.call(o) === `[object ${t}]`;

const AtomicCtx = createContext({});

/**
 * Helpers
 */
const pass = v => v;
const draftify = v => (isDraft(v)
  ? v
  : isDraftable(v)
    ? createDraft(v)
    : v);

/**
 * 在黑暗中所有东西都将被揭开
 */
const vn = {
  gots: {},
  puts: {},
  getGot(id) {
    return this.gots[id];
  },
  getPut(id) {
    return this.puts[id];
  },
};

class AtomicBox extends PureComponent {
  state = {
    store: {}, // eslint-disable-line
    put: () => {}, // eslint-disable-line
  };

  componentWillUnmount() {
    const { _id } = this.props;
    vn.gots[_id] = undefined;
    vn.puts[_id] = undefined;
  }

  static getDerivedStateFromProps(props) {
    const { ctx, _id } = props;
    const { state: store, setState } = ctx;
    const put = setState.bind(ctx);
    vn.gots[_id] = store;
    vn.puts[_id] = producer => put(produce(store, producer));
    return { store, put };
  }

  render() {
    const { children } = this.props;
    // const { store, put } = this.state;
    return (
      <AtomicCtx.Provider value={this.state}>
        {children}
      </AtomicCtx.Provider>
    );
  }
}

let atomId = 233;

const atom = () => {
  const id = `AtomicBox${atomId++}`; // eslint-disable-line
  const Atomic = props => <AtomicBox {...props} _id={id} />;
  const got = () => vn.getGot(id);
  const put = (producer, waiting = 0) => new Promise((resolve) => {
    vn.getPut(id)(producer);
    setTimeout(() => {
      resolve(got());
    }, waiting);
  });
  got.next = (waiting = 0) => new Promise((resolve) => {
    setTimeout(() => {
      resolve(got());
    }, waiting);
  });

  return [got, put, Atomic];
};


const handleGot = (got) => {
  switch (true) {
    case isType(got, 'Array'):
      return [got[0] || 'value', got[1] || pass];
    case isType(got, 'String'):
      return [got || 'value', pass];
    case isType(got, 'Function'):
      return ['value', got];
    default:
      return ['value', pass];
  }
};

const handlePut = (put) => {
  switch (true) {
    case isType(put, 'Array'):
      return [put[0] || 'onChange', put[1] || pass];
    case isType(put, 'String'):
      return [put || 'onChange', pass];
    case isType(put, 'Function'):
      return ['onChange', put];
    default:
      return ['onChange', pass];
  }
};

class Atom extends PureComponent {
  renderAtom = (ctx) => {
    const {
      vm, got, put, children, render,
    } = this.props;
    const { store, put: ctxPut } = ctx;

    const path = _castPath(vm);
    const [gotPath, gotSelector] = handleGot(got);
    const [putEventName, putChanger] = handlePut(put);

    const draftV = draftify(gotSelector(_.get(store, path)));

    const childrenProps = {
      ...children.props,
      [gotPath]: draftV,
    };


    if (put !== false) {
      const pipeEvent = childrenProps[putEventName] || pass;
      childrenProps[putEventName] = (e, ...args) => {
        const nextValue = pipeEvent(e, ...args);
        if (nextValue === undefined) {
          console.warn('[Atom] value 被谁吃掉了');
          console.trace();
        }
        const v = putChanger(draftify(nextValue), draftV, draftify(store));
        // 看是否需要
        // const final = isDraft(v) ? finishDraft(v) : v;
        ctxPut(produce(store, draft => _.set(draft, path, v)));
      };
    }

    if (isType(children, 'Function')) {
      return children(childrenProps);
    }
    if (isType(render, 'Function')) {
      return render(childrenProps);
    }

    return React.cloneElement(children, childrenProps);
  }

  render() {
    return (
      <AtomicCtx.Consumer>
        {this.renderAtom}
      </AtomicCtx.Consumer>
    );
  }
}

/**
 * --------------------------------------------
 * AtomIt
 * --------------------------------------------
 * introduce your pipeHOC
 */
const AtomIt = (Comp) => {
  class AtomItBox extends PureComponent {
    static displayName = `AtomItBox${Comp.displayName || Comp.name || ''}`;

    static propTypes = {
      forwardRef: PropTypes.oneOfType([
        PropTypes.func,
        // Element is just window.Element, this type for React.createRef()
        PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
      ]),
    };

    static defaultProps = {
      forwardRef: null,
    }

    renderAtomIt = (ctx) => {
      const {
        vm, got, put, forwardRef: ref,
      } = this.props;
      const { store, put: ctxPut } = ctx;

      const path = _castPath(vm);
      const [gotPath, gotSelector] = handleGot(got);
      const [putEventName, putChanger] = handlePut(put);

      const draftV = draftify(gotSelector(_.get(store, path)));

      const childrenProps = {
        ...this.props,
        ref,
        [gotPath]: draftV,
      };


      if (put !== false) {
        const pipeEvent = childrenProps[putEventName] || pass;
        childrenProps[putEventName] = (e, ...args) => {
          const nextValue = pipeEvent(e, ...args);
          if (nextValue === undefined) {
            console.warn('[Atom] value 被谁吃掉了');
            console.trace();
          }
          const v = putChanger(draftify(nextValue), draftV, draftify(store));
          // 看是否需要
          // const final = isDraft(v) ? finishDraft(v) : v;
          ctxPut(produce(store, draft => _.set(draft, path, v)));
        };
      }

      return <Comp {...childrenProps} />;
    }

    render() {
      return (
        <AtomicCtx.Consumer>
          {this.renderAtomIt}
        </AtomicCtx.Consumer>
      );
    }
  }

  // it is not need for ppph, but it better to make your PipeHOC common.
  hoistNonReactStatics(AtomItBox, Comp);
  // forward the ref.
  return forwardRef((props, ref) => <AtomItBox {...props} forwardRef={ref} />);
};


export {
  Atom,
  atom,
  AtomIt,
};
