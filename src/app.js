import React, { PureComponent, useState, useEffect } from 'react';
import { stringify } from 'stringify-parse';
import {
  Space, Atomic, ruler, discover,
} from './space';

const Input = Atomic((props) => {
  const onChange = (e) => {
    props.onChange(e.target.value);
  };
  return (
    <div>
      <input type="text" {...props} onChange={onChange} />
      <pre>{JSON.stringify(props, null, 2)}</pre>
    </div>
  );
});

// const db = {
//   value: { name: '2333' },
//   onChange: (next) => {
//     db.value = next;
//   },
// };

// const theRuler = ruler();
// const number = v => (/\d+$/.test(v) ? null : '只能输入数字');
// const http = () => new Promise((resolve, reject) => {
//   setTimeout(() => {
//     if (Math.random() > 0.3) {
//       resolve();
//     }
//     reject('http wali failed');
//   }, 1000);
// });

// class App extends PureComponent {
// state = {
//   name: '',
// };

// onChange=(val) => {
//   console.log('onChange', val);
// }

// onClickReset = () => {
//   theRuler.clear();
// }

// onClickRule = () => {
//   theRuler.rule().then(() => {
//     console.log('rule pass');
//   }).catch((reason) => {
//     console.error('rule failed, reason:', reason);
//   });
// }

// onClickReRule = () => {
//   theRuler.ruling().then(() => {
//     console.log('ruling pass');
//   }).catch((reasons) => {
//     console.log('ruling failed reasons', reasons);
//   });
// }


// diff = (nextState) => {
//   console.log('next', nextState, this.state);
//   if (nextState !== this.state) {
//     console.log('next update');
//     this.setState(nextState);
//   }
// }

//   onEffect = (v) => {
//     console.log('onEffect', v);
//   }

//   render() {
//     return (
//       <div>
//         <Space with={this} effect={this.onEffect} ruler={theRuler}>
//           <div>
//             <Input vm="name" onChange={this.onChange} rules={[number, http]} />
//           </div>
//         </Space>
//         <button type="button" onClick={this.onClickReset}>reset</button>
//         <button type="button" onClick={this.onClickReRule}>rerule</button>
//         <button type="button" onClick={this.onClickRule}>rule</button>
//       </div>
//     );
//   }
// }

const HooksApp = (props) => {
  const [state, setState] = useState({ name: '' });
  useEffect(() => {
    console.log('out effect', state);
  });
  const onChange = (val) => {
    console.log('onChange', val);
  };
  const inputChange = (val) => {
    console.log('input onChange', val);
  };

  const onClick = (e) => {
    setState({ name: +new Date() });
    // db.onChange({ name: +new Date() });
  };

  const onSubmit = () => {
    console.log('state', state);
    // console.log('db', db.value);
  };

  const onEffect = (v) => {
    console.log('onEffect', v);
  };

  return (
    <div>
      <Space with={[state, setState]} effect={onEffect}>
        <Input vm="name" onChange={inputChange} />
      </Space>
      <button type="button" onClick={onClick}>clickme</button>
      <button type="button" onClick={onSubmit}>submit</button>
    </div>
  );
};

// const db = {
//   value: {
//     name: '',
//   },
//   onChange(next) {
//     db.value = next;
//   },
// };
// const dd = discover();
// class App extends PureComponent {
//   state = {
//     name: '233',
//   }

//   goot = () => {
//     console.log('got', dd.got());
//   }

//   gotNext = () => {
//     dd.got.next().then((v) => {
//       console.log('got Next', v);
//     });
//   }

//   puut = () => {
//     dd.put((data) => {
//       data.name = +new Date();
//     }).then((n) => {
//       console.log('put then', n);
//     });
//     console.log('got', dd.got());
//   }

//   reset = () => {
//     dd.reset().then((n) => {
//       console.log('after reset', n);
//     });
//   }

//   rereset = () => {
//     dd.reset({ name: '666' }).then((n) => {
//       console.log('after reset', n);
//     });
//   }


//   onEffect = (v) => {
//     console.log('onEffect', v);
//   }

//   onChange = (v) => {
//     console.log('onChange name', v);
//     console.log('got', dd.got());
//     dd.got.next().then((n) => {
//       console.log('gotNext', n);
//     });
//   }


//   render() {
//     return (
//       <div>
//         <Space with={this} discover={dd} effect={this.onEffect}>
//           <Input vm="name" onChange={this.onChange} />
//         </Space>
//         <button type="button" onClick={this.goot}>got</button>
//         <button type="button" onClick={this.gotNext}>got.next</button>
//         <button type="button" onClick={this.puut}>put</button>
//         <button type="button" onClick={this.reset}>reset</button>
//         <button type="button" onClick={this.rereset}>rereset</button>
//       </div>
//     );
//   }
// }
// export default App;
export default HooksApp;
