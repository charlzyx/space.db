
const isThenable = p => (typeof p.then === 'function');

const flushPromise = (tasks, init) => tasks.reduce((p, task, index) => {
  const isLast = index === tasks.length - 1;
  if (!isThenable(p)) {
    return isLast ? Promise.resolve(task(p)) : task(p);
  }
  return p.then((answer) => {
    const next = task(answer);
    if (isThenable(next)) {
      return next;
    }
    return Promise.resolve(next);
  });
}, init);

const flush = (tasks, init) => tasks.reduce((next, task) => task(next), init);
flush.async = flushPromise;
// test
// flush([
//   v => v + 1,
//   v => new Promise((resolve, reject) => {
//     setTimeout(() => {
//       if (Math.random() > 0.5) {
//         resolve(v + 2);
//       } else {
//         reject(new Error('error in 2nd'));
//       }
//     }, 1000);
//   }),
//   v => v + 3,
//   v => new Promise((resolve) => {
//     setTimeout(() => {
//       resolve(v + 4);
//     }, 1000);
//   }),
// ], 1).then((answer) => {
//   console.log('answer', answer);
// }).catch((reason) => {
//   console.log('reason', reason);
// });

export default flush;
