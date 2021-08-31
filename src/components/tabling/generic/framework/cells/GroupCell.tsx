import { useMemo } from "react";
import { useSelector } from "react-redux";
import { isNil, find } from "lodash";

import { hooks, tabling } from "lib";

import { IconButton } from "components/buttons";
import { Cell, ValueCell } from "components/tabling/generic/framework/cells";

interface GroupCellProps<
  R extends Table.RowData,
  M extends Model.Model = Model.Model,
  G extends Model.Group = Model.Group,
  S extends Redux.TableStore<R, M, G> = Redux.TableStore<R, M, G>
> extends Table.ValueCellProps<R, M, S> {
  readonly onEdit?: (group: G) => void;
}

/* eslint-disable indent */
const GroupCell = <
  R extends Table.RowData,
  M extends Model.Model = Model.Model,
  G extends Model.Group = Model.Group,
  S extends Redux.TableStore<R, M, G> = Redux.TableStore<R, M, G>
>({
  onEdit,
  ...props
}: GroupCellProps<R, M, G, S>): JSX.Element => {
  const row: Table.Row<R> = props.node.data;
  const groups = useSelector((state: Application.Store) => props.selector(state).groups);

  const groupId = useMemo(() => {
    return tabling.typeguards.isDataRow(row) ? row.meta.group : null;
  }, [row]);

  const group = useMemo<G | null>((): G | null => {
    const g: G | null = find(groups, { id: groupId } as any) || null;
    return g;
  }, [groupId, hooks.useDeepEqualMemo(groups)]);

  const groupCell = useMemo(() => {
    if (!isNil(group)) {
      return (
        <Cell {...props}>
          <div style={{ display: "flex" }}>
            <span>{`${group.name} (${group.children.length} Line Items)`}</span>
            <IconButton
              className={"btn btn--edit-group"}
              size={"xxsmall"}
              icon={"edit"}
              onClick={() => onEdit?.(group)}
              style={
                !isNil(row.meta.colorDef) && !isNil(row.meta.colorDef.color) ? { color: row.meta.colorDef.color } : {}
              }
            />
          </div>
        </Cell>
      );
    }
    return null;
  }, [group, onEdit]);

  if (!isNil(tabling.typeguards.isGroupRow(row))) {
    return !isNil(groupCell) ? groupCell : <span></span>;
  }
  return <ValueCell {...props} />;
};

export default GroupCell;
