import React, { PureComponent, useState, useEffect } from 'react';
import { Space, Atomic } from './space';

const Input = Atomic((props) => {
  const onChange = (e) => {
    props.onChange(e.target.value);
  };
  return <input type="text" {...props} onChange={onChange} />;
});
const Show = Atomic(props => props.value || '');


const db = {
  value: { name: '2333' },
  onChange: (next) => {
    db.value = next;
  },
};


class App extends PureComponent {
  // state = {
  //   name: '',
  // };

  onChange=(val) => {
    console.log('onChange', val);
  }

  onClick = (e) => {
    // window.get = () => this.state;
    this.setState({ name: +new Date() });
    // db.onChange({ name: +new Date() });
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
        <Space with={this} effect={this.onEffect}>
          <div>
            <Input vm="name" onChange={this.onChange} />
          </div>
          <div>
            <Show vm="name" />
          </div>
        </Space>
        <button type="button" onClick={this.onClick}>clickme</button>
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
