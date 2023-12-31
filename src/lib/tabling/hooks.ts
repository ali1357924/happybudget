import { useRef } from "react";

import { notifications } from "lib";

export const InitialGridRef: Table.DataGridInstance = {
  getCSVData: () => []
};

export const useDataGrid = (): NonNullRef<Table.DataGridInstance> => {
  return useRef<Table.DataGridInstance>(InitialGridRef);
};

export const InitialTableRef: Table.TableInstance<Table.RowData, Model.RowHttpModel> = {
  ...InitialGridRef,
  notifications: [],
  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  saving: () => {},
  notify: () => {
    console.warn(
      `Cannot dispatch notifications ${notifications.objToJson(
        notifications
      )} to table because table ref has not been attached yet.`
    );
    return [];
  },
  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  clearNotifications: () => {},
  lookupAndNotify: () => [],
  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  handleRequestError: () => [],
  getColumns: () => [],
  getFocusedRow: () => null,
  getRow: () => null,
  getRows: () => [],
  getRowsAboveAndIncludingFocusedRow: () => [],
  /* eslint-disable @typescript-eslint/no-empty-function */
  changeColumnVisibility: () => {},
  /* eslint-disable @typescript-eslint/no-empty-function */
  dispatchEvent: () => {}
};

export const useTable = <R extends Table.RowData, M extends Model.RowHttpModel = Model.RowHttpModel>(): NonNullRef<
  Table.TableInstance<R, M>
> => useRef<Table.TableInstance<R, M>>(InitialTableRef as Table.TableInstance<R, M>);
