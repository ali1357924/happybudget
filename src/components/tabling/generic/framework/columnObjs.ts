import { isNil, find } from "lodash";
import { SuppressKeyboardEventParams } from "@ag-grid-community/core";

import { tabling, util, model } from "lib";

/* eslint-disable indent */
export const Column = <
  R extends Table.RowData,
  M extends Model.Model = Model.Model,
  G extends Model.Group = Model.Group,
  V extends Table.RowValue<R> = Table.RowValue<R>
>(
  col: Partial<Table.Column<R, M, G, V>>
): Table.Column<R, M, G, V> =>
  ({
    ...col,
    domain: "aggrid"
  } as Table.Column<R, M, G, V>);

export const ActionColumn = <
  R extends Table.RowData,
  M extends Model.Model = Model.Model,
  G extends Model.Group = Model.Group
>(
  col: Partial<Table.Column<R, M, G>>
): Partial<Table.Column<R, M, G>> =>
  Column({
    ...col,
    selectable: false,
    columnType: "action",
    tableColumnType: "action",
    isRead: false,
    isWrite: false,
    headerName: "",
    editable: false,
    suppressSizeToFit: true,
    resizable: false,
    cellClass: tabling.aggrid.mergeClassNamesFn("cell--centered", "cell--action", col.cellClass),
    canBeHidden: false,
    canBeExported: false
  });

export const CalculatedColumn = <
  R extends Table.RowData,
  M extends Model.Model = Model.Model,
  G extends Model.Group = Model.Group,
  V extends Table.RowValue<R> = Table.RowValue<R>
>(
  col: Partial<Table.Column<R, M, G, V>>,
  width?: number
): Table.Column<R, M, G, V> => {
  return Column<R, M, G, V>({
    ...col,
    cellStyle: { textAlign: "right", ...col.cellStyle },
    cellRenderer: "CalculatedCell",
    tableColumnType: "calculated",
    columnType: "sum",
    isRead: true,
    isWrite: false,
    suppressSizeToFit: true,
    width: !isNil(width) ? width : 100,
    // maxWidth: !isNil(width) ? width : 100,
    cellClass: tabling.aggrid.mergeClassNamesFn("cell--calculated", col.cellClass),
    valueFormatter: tabling.formatters.agCurrencyValueFormatter,
    cellRendererParams: {
      ...col.cellRendererParams,
      renderRedIfNegative: true
    }
  });
};

export const BodyColumn = <
  R extends Table.RowData,
  M extends Model.Model = Model.Model,
  G extends Model.Group = Model.Group,
  V extends Table.RowValue<R> = Table.RowValue<R>
>(
  col: Partial<Table.Column<R, M, G, V>>
): Table.Column<R, M, G, V> => {
  return Column<R, M, G, V>({
    // Not using our own cell renderer here boosts performance.
    // cellRenderer: "BodyCell",
    suppressSizeToFit: true,
    ...col,
    tableColumnType: "body"
  });
};

export const ExpandColumn = <
  R extends Table.RowData,
  M extends Model.Model = Model.Model,
  G extends Model.Group = Model.Group
>(
  col: Partial<Table.Column<R, M, G>>,
  width?: number
): Table.Column<R, M, G> =>
  ActionColumn({
    /* eslint-disable indent */
    cellRenderer: "ExpandCell",
    ...col,
    width: !isNil(width) ? width : 30,
    maxWidth: !isNil(width) ? width : 30,
    field: "expand" as keyof R & string
  }) as Table.Column<R, M, G>;

export const IndexColumn = <
  R extends Table.RowData,
  M extends Model.Model = Model.Model,
  G extends Model.Group = Model.Group
>(
  col: Partial<Table.Column<R, M, G>>,
  hasExpandColumn: boolean,
  width?: number
): Table.Column<R, M, G> =>
  ActionColumn({
    /* eslint-disable indent */
    cellRenderer: "EmptyCell",
    ...col,
    field: "index" as keyof R,
    width: !isNil(width) ? width : hasExpandColumn === false ? 40 : 25,
    maxWidth: !isNil(width) ? width : hasExpandColumn === false ? 40 : 25
  }) as Table.Column<R, M, G>;

export interface SelectColumnProps<
  R extends Table.RowData,
  M extends Model.Model = Model.Model,
  G extends Model.Group = Model.Group,
  V extends Table.RowValue<R> = Table.RowValue<R>
> extends Omit<Table.Column<R, M, G, V>, "columnType" | "tableColumnType" | "domain"> {
  readonly columnType?: Table.ColumnTypeId;
}

// Abstract - not meant to be used by individual columns.  It just enforces that
// the clipboard processing props are provided.
export const SelectColumn = <
  R extends Table.RowData,
  M extends Model.Model = Model.Model,
  G extends Model.Group = Model.Group,
  V extends Table.RowValue<R> = Table.RowValue<R>
>(
  props: SelectColumnProps<R, M, G, V>
): Table.Column<R, M, G, V> => {
  return BodyColumn<R, M, G, V>({
    columnType: "singleSelect",
    suppressSizeToFit: true,
    ...props,
    cellClass: tabling.aggrid.mergeClassNamesFn("cell--renders-html", props.cellClass),
    // Required to allow the dropdown to be selectable on Enter key.
    suppressKeyboardEvent: !isNil(props.suppressKeyboardEvent)
      ? props.suppressKeyboardEvent
      : (params: SuppressKeyboardEventParams) => {
          if ((params.event.code === "Enter" || params.event.code === "Tab") && params.editing) {
            return true;
          }
          return false;
        }
  });
};

export interface UnauthenticatedModelSelectColumnProps<
  R extends Table.RowData,
  M extends Model.Model = Model.Model,
  C extends Model.Model = Model.Model,
  G extends Model.Group = Model.Group
> extends SetOptional<SelectColumnProps<R, M, G>, "processCellForClipboard"> {
  readonly models: C[];
  readonly modelClipboardValue: (m: C) => string;
}

export const UnauthenticatedModelSelectColumn = <
  R extends Table.RowData,
  M extends Model.Model = Model.Model,
  C extends Model.Model = Model.Model,
  G extends Model.Group = Model.Group
>(
  props: UnauthenticatedModelSelectColumnProps<R, M, C, G>
): Table.Column<R, M, G> => {
  const { models, modelClipboardValue, ...column } = props;
  return SelectColumn<R, M, G>({
    processCellForClipboard:
      column.processCellForClipboard ??
      ((row: R) => {
        const id = util.getKeyValue<R, keyof R>(props.field as keyof R)(row);
        if (isNil(id)) {
          return "";
        }
        const m: C | undefined = find(models, { id } as any);
        return !isNil(m) ? modelClipboardValue(m) : "";
      }),
    ...column
  });
};

export interface ModelSelectColumnProps<
  R extends Table.RowData,
  M extends Model.Model = Model.Model,
  C extends Model.Model = Model.Model,
  G extends Model.Group = Model.Group
> extends UnauthenticatedModelSelectColumnProps<R, M, C, G> {
  readonly processCellFromClipboard: (value: string) => C | null;
}

export const ModelSelectColumn = <
  R extends Table.RowData,
  M extends Model.Model = Model.Model,
  C extends Model.Model = Model.Model,
  G extends Model.Group = Model.Group
>(
  props: ModelSelectColumnProps<R, M, C, G>
): Table.Column<R, M, G> => {
  return UnauthenticatedModelSelectColumn(props);
};

export interface TagSelectColumnProps<
  R extends Table.RowData,
  M extends Model.Model = Model.Model,
  G extends Model.Group = Model.Group
> extends SetOptional<SelectColumnProps<R, M, G>, "processCellForClipboard"> {
  readonly models: Model.Tag[];
  readonly processCellFromClipboard?: (value: string) => Model.Tag | null;
}

export const TagSelectColumn = <
  R extends Table.RowData,
  M extends Model.Model = Model.Model,
  G extends Model.Group = Model.Group
>(
  props: TagSelectColumnProps<R, M, G>
): Table.Column<R, M, G> => {
  const { models, ...column } = props;
  return SelectColumn({
    processCellForClipboard: (row: R) => {
      const m: Model.Tag | undefined = util.getKeyValue<R, keyof R>(props.field as keyof R)(row) as any;
      if (isNil(m)) {
        return "";
      }
      return m.title;
    },
    getHttpValue: (value: Model.Tag | null): ID | null => (!isNil(value) ? value.id : null),
    processCellFromClipboard: (name: string) =>
      // TODO: We might have to also consider the plural_title here.
      model.util.inferModelFromName<Model.Tag>(models, name, { nameField: "title" }),
    ...column
  });
};

export interface ChoiceSelectColumnProps<
  R extends Table.RowData,
  M extends Model.Model = Model.Model,
  C extends Model.Choice<any, any> = Model.Choice<any, any>,
  G extends Model.Group = Model.Group
> extends SetOptional<SelectColumnProps<R, M, G>, "processCellForClipboard"> {
  readonly models: C[];
  readonly processCellFromClipboard?: (value: string) => C | null;
}

export const ChoiceSelectColumn = <
  R extends Table.RowData,
  M extends Model.Model = Model.Model,
  C extends Model.Choice<any, any> = Model.Choice<any, any>,
  G extends Model.Group = Model.Group
>(
  props: ChoiceSelectColumnProps<R, M, C, G>
): Table.Column<R, M, G> => {
  const { models, ...column } = props;
  return SelectColumn({
    getHttpValue: (value: C | null): ID | null => (!isNil(value) ? value.id : null),
    processCellForClipboard: (row: R) => {
      const m: C | undefined = util.getKeyValue<R, keyof R>(props.field as keyof R)(row) as any;
      if (isNil(m)) {
        return "";
      }
      return m.name;
    },
    processCellFromClipboard: (name: string) => model.util.findChoiceForName<C>(models, name),
    ...column
  });
};
