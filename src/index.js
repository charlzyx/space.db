import React from 'react';
import ReactDOM from 'react-dom';
// import ppph, { piper } from 'ppph';
import App from './app';
// import { AtomIt } from './atom.io';

// /**
//  * --------------------------------------------
//  * pipe atom
//  * --------------------------------------------
//  * introduce your pipe
//  */
// const atom = piper({
//   who: 'atom', // name for pipe
//   when: (type, props) => props.vm, // condition to use the pipe
//   how: AtomIt, // the HOC for this pipe, means how to deal with it
//   why: (e) => { // a callback will be call when error occur.
//     console.error('[AtomIt] error: ');
//     console.dir(e);
//   },
//   // pH: means sort weight, just like pH, the lower pH value, the heighter sort weight;
//   // key: pependent key name in JSX, which will be sort by write order;
//   ph: [7, 'atom'],
// });

// ppph.use(atom);
// ppph.inject();

ReactDOM.render(
  <App />,
  document.getElementById('app'),
);

module.hot.accept();
