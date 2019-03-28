import React, { PureComponent } from 'react';
import { Space, Atomic } from 'space.db';
import _ from 'lodash';

const Input = props => (
  <input
    {...props}
    onChange={(e) => {
      props.onChange(e.target.value);
    }}
  />
);
const AI = Atomic(Input);


const eva = e => e.target.value;
const required = v => (v ? null : '必填');
const limit = (max, min) => v => Math.min(Math.max(v, min), max);
const throttle = wait => _.throttle(v => v, wait);
const debounce = wait => _.debounce(v => v, wait);
const promise = v => new Promise(((resolve) => {
  setTimeout(() => {
    // console.count('promise');
    // console.log(v);
    resolve(v + 2);
  }, 3000 * Math.random());
}));

class App extends PureComponent {
  state = {
    name: '',
  };

  changeName = (next) => {
    this.setState({ name: next });
  };

  onNameChange = (name) => {
    // console.log('name', name);
  };

  render() {
    return (
      <Space with={this}>
        <AI
          // type="number"
          input={['name', 'value']}
          output={['onChange', limit(10000, 0), promise]}
          effect={[this.onNameChange]}
        />
      </Space>
    );
  }
}

export default App;
