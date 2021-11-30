import { SyntheticEvent } from "react";

export const isRow = <R extends Table.RowData, M extends Model.Model>(obj: Table.Row<R> | M): obj is Table.Row<R> =>
  (obj as Table.Row<R>).rowType !== undefined;

export const isRowWithColor = <R extends Table.RowData>(
  r: Table.Row<R> | Table.RowWithColor<R>
): r is Table.RowWithColor<R> => {
  return isBodyRow(r) && (r as Table.RowWithColor<R>).data.color !== undefined;
};

export const isRowWithName = <R extends Table.RowData>(
  r: Table.Row<R> | Table.RowWithName<R>
): r is Table.RowWithName<R> => {
  return isBodyRow(r) && (r as Table.RowWithName<R>).data.name !== undefined;
};

export const isRowWithDescription = <R extends Table.RowData>(
  r: Table.Row<R> | Table.RowWithDescription<R>
): r is Table.RowWithDescription<R> => {
  return isBodyRow(r) && (r as Table.RowWithDescription<R>).data.description !== undefined;
};

export const isRowWithIdentifier = <R extends Table.RowData>(
  r: Table.Row<R> | Table.RowWithIdentifier<R>
): r is Table.RowWithIdentifier<R> => {
  return isBodyRow(r) && (r as Table.RowWithIdentifier<R>).data.identifier !== undefined;
};

export const isPlaceholderRow = <R extends Table.RowData = object>(row: Table.Row<R>): row is Table.PlaceholderRow<R> =>
  (row as Table.PlaceholderRow<R>).rowType === "placeholder";

export const isPlaceholderRowId = (id: Table.RowId): id is Table.PlaceholderRowId =>
  typeof id === "string" && id.startsWith("placeholder-");

export const isGroupRow = <R extends Table.RowData = object>(row: Table.Row<R>): row is Table.GroupRow<R> =>
  (row as Table.GroupRow<R>).rowType === "group";

export const isGroupRowId = (id: Table.RowId): id is Table.GroupRowId =>
  typeof id === "string" && id.startsWith("group-");

export const isFooterRow = <R extends Table.RowData = object>(row: Table.Row<R>): row is Table.FooterRow =>
  (row as Table.FooterRow).rowType === "footer";

export const isFooterRowId = (id: Table.RowId): id is Table.FooterRowId =>
  typeof id === "string" && id.startsWith("footer-");

export const isBodyRow = <R extends Table.RowData = object>(row: Table.Row<R>): row is Table.BodyRow<R> =>
  !isFooterRow(row);

export const isBodyRowId = (id: Table.RowId): id is Table.FooterRowId =>
  typeof id === "string" && !id.startsWith("footer-");

export const isMarkupRow = <R extends Table.RowData = object>(row: Table.Row<R>): row is Table.MarkupRow<R> =>
  (row as Table.MarkupRow<R>).rowType === "markup";

export const isMarkupRowId = (id: Table.RowId): id is Table.MarkupRowId =>
  typeof id === "string" && id.startsWith("markup-");

export const isModelRow = <R extends Table.RowData = object>(row: Table.Row<R>): row is Table.ModelRow<R> =>
  (row as Table.ModelRow<R>).rowType === "model";

export const isModelRowId = (id: Table.RowId): id is Table.ModelRowId => typeof id === "number";

export const isDataRow = <R extends Table.RowData = object>(row: Table.Row<R>): row is Table.DataRow<R> =>
  isPlaceholderRow(row) || isModelRow(row);

export const isDataRowId = (id: Table.RowId): id is Table.DataRowId => isModelRowId(id) || isPlaceholderRowId(id);

export const isEditableRow = <R extends Table.RowData = object>(row: Table.Row<R>): row is Table.EditableRow<R> =>
  (isModelRow(row) && row.gridId === "data") || isMarkupRow(row);

/* eslint-disable indent */
export const isNonPlaceholderBodyRow = <R extends Table.RowData = object>(
  row: Table.Row<R>
): row is Table.NonPlaceholderBodyRow<R> => isEditableRow(row) || isGroupRow(row);

export type ActionMapFromObject<T> = T extends Redux.ActionMapObject<infer A> ? A : never;

/* eslint-disable indent */
export const isAuthenticatedActionMap = <R extends Table.RowData, M extends Model.RowHttpModel = Model.RowHttpModel>(
  a: Redux.ActionMapObject<Redux.TableActionMap<M>> | Redux.ActionMapObject<Redux.AuthenticatedTableActionMap<R, M>>
): a is Redux.ActionMapObject<Redux.AuthenticatedTableActionMap<R, M>> =>
  (a as Redux.ActionMapObject<Redux.AuthenticatedTableActionMap<R, M>>).tableChanged !== undefined;

export const isKeyboardEvent = (e: Table.CellDoneEditingEvent): e is KeyboardEvent => {
  return (e as KeyboardEvent).type === "keydown" && (e as KeyboardEvent).code !== undefined;
};

export const isSyntheticClickEvent = (e: Table.CellDoneEditingEvent): e is SyntheticEvent => {
  return (e as SyntheticEvent).type === "click";
};

export const isDataChangeEvent = <
  R extends Table.RowData,
  M extends Model.RowHttpModel = Model.RowHttpModel,
  I extends Table.EditableRowId = Table.EditableRowId
>(
  e: Table.ChangeEvent<R, M>
): e is Table.DataChangeEvent<R, I> => {
  return (e as Table.DataChangeEvent<R, I>).type === "dataChange";
};

export const isActionWithDataChangeEvent = <
  R extends Table.RowData,
  M extends Model.RowHttpModel = Model.RowHttpModel,
  I extends Table.EditableRowId = Table.EditableRowId
>(
  a: Redux.Action<Table.ChangeEvent<R, M>>
): a is Redux.Action<Table.DataChangeEvent<R, I>> => {
  return isDataChangeEvent(a.payload);
};

export const isModelUpdatedEvent = <R extends Table.RowData, M extends Model.RowHttpModel = Model.RowHttpModel>(
  e: Table.ChangeEvent<R, M>
): e is Table.ModelUpdatedEvent<M> => {
  return (e as Table.ModelUpdatedEvent<M>).type === "modelUpdated";
};

export const isRowAddEvent = <R extends Table.RowData, M extends Model.RowHttpModel = Model.RowHttpModel>(
  e: Table.ChangeEvent<R, M>
): e is Table.RowAddEvent<R> => {
  return (e as Table.RowAddEvent<R>).type === "rowAdd";
};

export const isRowDeleteEvent = <R extends Table.RowData, M extends Model.RowHttpModel = Model.RowHttpModel>(
  e: Table.ChangeEvent<R, M>
): e is Table.RowDeleteEvent => {
  return (e as Table.RowDeleteEvent).type === "rowDelete";
};

export const isRowPositionChangedEvent = <R extends Table.RowData, M extends Model.RowHttpModel = Model.RowHttpModel>(
  e: Table.ChangeEvent<R, M>
): e is Table.RowPositionChangedEvent => {
  return (e as Table.RowPositionChangedEvent).type === "rowPositionChanged";
};

export const isRowRemoveFromGroupEvent = <R extends Table.RowData, M extends Model.RowHttpModel = Model.RowHttpModel>(
  e: Table.ChangeEvent<R, M>
): e is Table.RowRemoveFromGroupEvent => {
  return (e as Table.RowRemoveFromGroupEvent).type === "rowRemoveFromGroup";
};

export const isRowAddToGroupEvent = <R extends Table.RowData, M extends Model.RowHttpModel = Model.RowHttpModel>(
  e: Table.ChangeEvent<R, M>
): e is Table.RowAddToGroupEvent => {
  return (e as Table.RowAddToGroupEvent).type === "rowAddToGroup";
};

export const isGroupAddedEvent = <R extends Table.RowData, M extends Model.RowHttpModel = Model.RowHttpModel>(
  e: Table.ChangeEvent<R, M>
): e is Table.GroupAddedEvent => {
  return (e as Table.GroupAddedEvent).type === "groupAdded";
};

export const isFullRowEvent = <R extends Table.RowData, M extends Model.RowHttpModel = Model.RowHttpModel>(
  e: Table.ChangeEvent<R, M>
): e is Table.FullRowEvent => {
  return (e as Table.FullRowEvent).payload.rows !== undefined;
};

export const isGroupEvent = <R extends Table.RowData, M extends Model.RowHttpModel = Model.RowHttpModel>(
  e: Table.ChangeEvent<R, M>
): e is Table.GroupEvent => {
  return isRowAddToGroupEvent(e) || isRowRemoveFromGroupEvent(e) || isGroupUpdateEvent(e) || isGroupAddedEvent(e);
};

export const isGroupUpdateEvent = <R extends Table.RowData, M extends Model.RowHttpModel = Model.RowHttpModel>(
  e: Table.ChangeEvent<R, M>
): e is Table.GroupUpdatedEvent => {
  return (e as Table.GroupUpdatedEvent).type === "groupUpdated";
};

export const isMarkupAddedEvent = <R extends Table.RowData, M extends Model.RowHttpModel = Model.RowHttpModel>(
  e: Table.ChangeEvent<R, M>
): e is Table.MarkupAddedEvent => {
  return (e as Table.MarkupAddedEvent).type === "markupAdded";
};

export const isMarkupUpdatedEvent = <R extends Table.RowData, M extends Model.RowHttpModel = Model.RowHttpModel>(
  e: Table.ChangeEvent<R, M>
): e is Table.MarkupUpdatedEvent => {
  return (e as Table.MarkupUpdatedEvent).type === "markupUpdated";
};

export const isRowRemoveFromMarkupEvent = <R extends Table.RowData, M extends Model.RowHttpModel = Model.RowHttpModel>(
  e: Table.ChangeEvent<R, M>
): e is Table.RowRemoveFromMarkupEvent => {
  return (e as Table.RowRemoveFromMarkupEvent).type === "rowRemoveFromMarkup";
};

export const isRowAddToMarkupEvent = <R extends Table.RowData, M extends Model.RowHttpModel = Model.RowHttpModel>(
  e: Table.ChangeEvent<R, M>
): e is Table.RowAddToMarkupEvent => {
  return (e as Table.RowAddToMarkupEvent).type === "rowAddToMarkup";
};
