import { useMemo } from "react";
import { isNil, map } from "lodash";
import hoistNonReactStatics from "hoist-non-react-statics";

import { CellKeyDownEvent, NavigateToNextCellParams, TabToNextCellParams } from "@ag-grid-community/core";

import { hooks } from "lib";

import useCellNavigation from "./useCellNavigation";

type InjectedUnauthenticatedDataGridProps = {
  readonly onCellKeyDown?: (event: CellKeyDownEvent) => void;
  readonly navigateToNextCell?: (params: NavigateToNextCellParams) => Table.CellPosition;
  readonly tabToNextCell?: (params: TabToNextCellParams) => Table.CellPosition;
};

export interface UnauthenticateDataGridProps<R extends Table.RowData, M extends Model.HttpModel = Model.HttpModel> {
  readonly apis: Table.GridApis | null;
  readonly columns: Table.Column<R, M>[];
}

export type WithUnauthenticatedDataGridProps<T> = T & InjectedUnauthenticatedDataGridProps;

/* eslint-disable indent */
const unauthenticatedDataGrid =
  <
    R extends Table.RowData,
    M extends Model.HttpModel = Model.HttpModel,
    T extends UnauthenticateDataGridProps<R, M> = UnauthenticateDataGridProps<R, M>
  >(
    config?: TableUi.UnauthenticatedDataGridConfig<R, M>
  ) =>
  (
    Component:
      | React.ComponentClass<WithUnauthenticatedDataGridProps<T>, {}>
      | React.FunctionComponent<WithUnauthenticatedDataGridProps<T>>
  ): React.FunctionComponent<T> => {
    function WithUnauthenticatedDataGrid(props: T) {
      /* eslint-disable no-unused-vars */
      /* eslint-disable @typescript-eslint/no-unused-vars */
      const [navigateToNextCell, tabToNextCell, _, moveToNextRow] = useCellNavigation<R, M>({
        apis: props.apis,
        columns: props.columns,
        includeRowInNavigation: config?.includeRowInNavigation
      });

      const columns = useMemo<Table.Column<R, M>[]>((): Table.Column<R, M>[] => {
        return map(props.columns, (col: Table.Column<R, M>) => ({
          ...col,
          editable: false
        }));
      }, [hooks.useDeepEqualMemo(props.columns)]);

      const onCellKeyDown: (e: Table.CellKeyDownEvent) => void = hooks.useDynamicCallback(
        (e: Table.CellKeyDownEvent) => {
          /* @ts-ignore  AG Grid's Event Object is Wrong */
          if (!isNil(e.e) & (e.e.code === "Enter") && !isNil(e.rowIndex)) {
            moveToNextRow({ rowIndex: e.rowIndex, column: e.column });
          }
        }
      );

      return (
        <Component
          {...props}
          columns={columns}
          onCellKeyDown={onCellKeyDown}
          navigateToNextCell={navigateToNextCell}
          tabToNextCell={tabToNextCell}
        />
      );
    }
    return hoistNonReactStatics(WithUnauthenticatedDataGrid, Component);
  };

export default unauthenticatedDataGrid;
