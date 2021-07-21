import { SyntheticEvent } from "react";

export const isKeyboardEvent = (e: Table.CellDoneEditingEvent): e is KeyboardEvent => {
  return (e as KeyboardEvent).type === "keydown" && (e as KeyboardEvent).code !== undefined;
};

export const isSyntheticClickEvent = (e: Table.CellDoneEditingEvent): e is SyntheticEvent => {
  return (e as SyntheticEvent).type === "click";
};

export const isDataChangeEvent = <R extends Table.Row, M extends Model.Model>(
  e: Table.ChangeEvent<R, M>
): e is Table.DataChangeEvent<R, M> => {
  return (e as Table.DataChangeEvent<R, M>).type === "dataChange";
};

export const isRowAddEvent = <R extends Table.Row, M extends Model.Model>(
  e: Table.ChangeEvent<R, M>
): e is Table.RowAddEvent<R, M> => {
  return (e as Table.RowAddEvent<R, M>).type === "rowAdd";
};

export const isRowDeleteEvent = <R extends Table.Row, M extends Model.Model>(
  e: Table.ChangeEvent<R, M>
): e is Table.RowDeleteEvent<R, M> => {
  return (e as Table.RowDeleteEvent<R, M>).type === "rowDelete";
};

export const tableChangeIsRowChange = <R extends Table.Row, M extends Model.Model>(
  change: Table.Change<R, M>
): change is Table.RowChange<R, M> => {
  return (
    !Array.isArray(change) &&
    (change as Table.RowChange<R, M>).data !== undefined &&
    (change as Table.RowChange<R, M>).id !== undefined
  );
};

export const tableChangeIsCellChange = <R extends Table.Row, M extends Model.Model>(
  change: Table.Change<R, M>
): change is Table.CellChange<R, M> => {
  return (
    !Array.isArray(change) &&
    (change as Table.CellChange<R, M>).oldValue !== undefined &&
    (change as Table.CellChange<R, M>).newValue !== undefined &&
    (change as Table.CellChange<R, M>).field !== undefined &&
    (change as Table.CellChange<R, M>).id !== undefined
  );
};
