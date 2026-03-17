import type { ReactNode, FC } from 'react';

const ShortcutTable: FC<{ children?: ReactNode }> = ({ children }) => (
  <table>
    <tbody>{children}</tbody>
  </table>
);

export default ShortcutTable;
