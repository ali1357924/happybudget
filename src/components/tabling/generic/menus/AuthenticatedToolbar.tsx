import React from "react";
import { map, isNil } from "lodash";

import { tabling } from "lib";
import TableMenuAction from "./MenuAction";

interface AuthenticatedToolbarProps<R extends Table.RowData, M extends Model.HttpModel = Model.HttpModel> {
  readonly apis: Table.GridApis | null;
  readonly columns: Table.Column<R, M>[];
  readonly actions: Table.AuthenticatedMenuActions<R, M>;
  readonly hiddenColumns: (keyof R | string)[];
  readonly selectedRows: Table.EditableRow<R>[];
}

/* eslint-disable indent */
const AuthenticatedToolbar = <R extends Table.RowData, M extends Model.HttpModel = Model.HttpModel>(
  props: AuthenticatedToolbarProps<R, M>
): JSX.Element => {
  return (
    <div className={"toolbar-buttons"}>
      {!isNil(props.apis) &&
        map(
          tabling.menu.evaluateActions<R, M, Table.AuthenticatedMenuActionParams<R, M>>(props.actions, {
            apis: props.apis,
            columns: props.columns,
            hiddenColumns: props.hiddenColumns,
            selectedRows: props.selectedRows
          }),
          (action: Table.MenuActionObj, index: number) => <TableMenuAction key={index} action={action} />
        )}
    </div>
  );
};

export default React.memo(AuthenticatedToolbar) as typeof AuthenticatedToolbar;
