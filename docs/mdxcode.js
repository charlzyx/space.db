/**
 * 代码染色体
 */

/* eslint-disable */

import React from 'react';
import Highlight, { defaultProps } from 'prism-react-renderer';
import { MDXProvider } from '@mdx-js/tag';
import { Container, baseStyles } from 'unified-ui';
import dracula from 'prism-react-renderer/themes/dracula';
import duotoneDark from 'prism-react-renderer/themes/duotoneDark';
import duotoneLight from 'prism-react-renderer/themes/duotoneLight';
import darnightOwlk from 'prism-react-renderer/themes/nightOwl';
import oceanicNext from 'prism-react-renderer/themes/oceanicNext';
import shadesOfPurple from 'prism-react-renderer/themes/shadesOfPurple';
import ultramin from 'prism-react-renderer/themes/ultramin';
import vsDark from 'prism-react-renderer/themes/vsDark';
import vsDarkPlus from 'prism-react-renderer/themes/vsDarkPlus';
import {
  LiveProvider, LiveEditor, LiveError, LivePreview,
} from 'react-live';

const CodeBlock = ({
  children, className, live, render,
}) => {
  const language = className.replace(/language-/, '');

  if (live) {
    return (
      <div style={{ marginTop: '40px' }}>
        <LiveProvider code={children}>
          <LivePreview />
          <LiveEditor />
          <LiveError />
        </LiveProvider>
      </div>
    );
  }
  if (render) {
    return (
      <div style={{ marginTop: '40px' }}>
        <LiveProvider code={children}>
          <LivePreview />
        </LiveProvider>
      </div>
    );
  }

  return (
    <Highlight
      {...defaultProps}
      theme={duotoneLight}
      code={children}
      language={language}
    >
      {({
        className, style, tokens, getLineProps, getTokenProps,
      }) => (
          <pre className={className} style={{ ...style, padding: '20px' }}>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line, key: i })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token, key })} />
                ))}
              </div>
            ))}
          </pre>
        )}
    </Highlight>
  );
};


const Style = ({ children }) => (
  <style
    dangerouslySetInnerHTML={{
      __html: children,
    }}
  />
);

const components = {
  pre: props => <div {...props} />,
  code: CodeBlock,
};

export default props => (
  <MDXProvider components={components}>
    <>
      <Style>{baseStyles}</Style>
      <Container {...props} />
    </>
  </MDXProvider>
);
