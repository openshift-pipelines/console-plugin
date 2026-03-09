import type { ReactNode, ComponentType, ComponentClass, FC } from 'react';
import { DndProvider, DndProviderProps } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const DndProviderWithChildren = DndProvider as ComponentType<
  DndProviderProps<any, any> & { children?: ReactNode }
>;

const withDragDropContext =
  <TProps extends {}>(
    Component: ComponentClass<TProps> | FC<TProps>,
  ) =>
  (props: TProps) => {
    return (
      <DndProviderWithChildren backend={HTML5Backend} context={window}>
        <Component {...props} />
      </DndProviderWithChildren>
    );
  };

export default withDragDropContext;
