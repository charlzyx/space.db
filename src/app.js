import React, { PureComponent, useState, useEffect } from 'react';
import { Space, Atomic, ruler } from './space';

const Input = Atomic((props) => {
  const onChange = (e) => {
    props.onChange(e.target.value);
  };
  return <input type="text" {...props} onChange={onChange} />;
});
const Show = Atomic(props => <pre>{JSON.stringify(props, null, 2)}</pre>);

const db = {
  value: { name: '2333' },
  onChange: (next) => {
    db.value = next;
  },
};

const theRuler = ruler();
const number = v => (/\d+$/.test(v) ? null : '只能输入数字');

class App extends PureComponent {
  // state = {
  //   name: '',
  // };

  onChange=(val) => {
    console.log('onChange', val);
  }

  onClickReset = (e) => {
    theRuler.reset();
  }

  onClickRule = (e) => {
    theRuler.rule().then((result) => {
      console.log('rule', result);
    });
  }

  onClickReRule = (e) => {
    theRuler.rerule();
  }


  // diff = (nextState) => {
  //   console.log('next', nextState, this.state);
  //   if (nextState !== this.state) {
  //     console.log('next update');
  //     this.setState(nextState);
  //   }
  // }

  onEffect = (v) => {
    console.log('onEffect', v);
  }

  render() {
    return (
      <div>
        <Space with={this} effect={this.onEffect} ruler={theRuler}>
          <div>
            <Input vm="name" onChange={this.onChange} rules={[number]} />
          </div>
          <div>
            <Show vm="name" rules={[number]} />
          </div>
        </Space>
        <button type="button" onClick={this.onClickReset}>reset</button>
        <button type="button" onClick={this.onClickReRule}>rerule</button>
        <button type="button" onClick={this.onClickRule}>rule</button>
      </div>
    );
  }
}

// const HooksApp = (props) => {
//   const [state, setState] = useState({ name: '' });
//   useEffect(() => {
//     console.log('out effect', state);
//   });
//   const onChange = (val) => {
//     console.log('onChange', val);
//   };
//   const inputChange = (val) => {
//     console.log('input onChange', val);
//   };

//   const onClick = (e) => {
//     setState({ name: +new Date() });
//     // db.onChange({ name: +new Date() });
//   };

//   const onSubmit = () => {
//     // console.log('state', state);
//     console.log('db', db.value);
//   };

//   const onEffect = (v) => {
//     console.log('onEffect', v);
//   };

//   return (
//     <div>
//       <Space with={db} effect={onEffect}>
//         <Input vm="name" onChange={inputChange} />
//       </Space>
//       <button type="button" onClick={onClick}>clickme</button>
//       <button type="button" onClick={onSubmit}>submit</button>
//     </div>
//   );
// };
export default App;
// export default HooksApp;
