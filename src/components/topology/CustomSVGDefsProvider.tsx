import SVGDefsContext from '@patternfly/react-topology/dist/esm/components/defs/SVGDefsContext';
import React, { useMemo } from 'react';

export const CustomSVGDefsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const defsMap = useMemo(() => new Map<string, React.ReactNode>(), []);

  const contextValue = {
    addDef: (id: string, element: React.ReactNode) => {
      defsMap.set(id, element);
    },
    removeDef: (id: string) => {
      defsMap.delete(id);
    },
  };

  return (
    <SVGDefsContext.Provider value={contextValue}>
      {children}
    </SVGDefsContext.Provider>
  );
};
