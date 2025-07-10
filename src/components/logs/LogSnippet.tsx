import * as React from 'react';

import './LogSnippet.scss';

type LogSnippetProps = {
  logSnippet?: string;
  message: string;
};

const LogSnippet: React.FC<LogSnippetProps> = ({ logSnippet, message }) => {
  return (
    <div className="opp-log-snippet">
      <p className="opp-log-snippet__status-message">{message}</p>
      {logSnippet && (
        <pre className="co-pre opp-log-snippet__log-snippet">{logSnippet}</pre>
      )}
    </div>
  );
};

export default LogSnippet;
