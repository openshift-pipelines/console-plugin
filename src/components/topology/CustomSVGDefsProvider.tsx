import SVGDefsContext from '@patternfly/react-topology/dist/esm/components/defs/SVGDefsContext';
import type { ReactNode, FC } from 'react';
import { useMemo } from 'react';

export const CustomSVGDefsProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const defsMap = useMemo(() => new Map<string, React.ReactNode>(), []);

  const contextValue = {
    addDef: (id: string, element: ReactNode) => {
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
