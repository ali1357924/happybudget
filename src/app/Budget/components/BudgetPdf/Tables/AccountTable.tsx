import { useMemo } from "react";
import { isNil, filter, forEach, reduce, find } from "lodash";
import classNames from "classnames";

import { tabling, hooks, model } from "lib";

import Table from "./Table";
import { BodyRow, HeaderRow, FooterRow, GroupRow } from "../Rows";

type M = Model.PdfSubAccount;
type R = Tables.PdfSubAccountRowData;

type AccountTableProps = {
  readonly account: Model.PdfAccount;
  readonly columns: Table.PdfColumn<R, M>[];
  readonly options: PdfBudgetTable.Options;
};

const AccountTable = ({
  /* eslint-disable indent */
  columns,
  account,
  options
}: AccountTableProps): JSX.Element => {
  const showFooterRow = useMemo(() => {
    return filter(columns, (column: Table.Column<R, M>) => !isNil(column.footer)).length !== 0;
  }, [columns]);

  const accountSubHeaderRow = useMemo(() => {
    const row: { [key: string]: any } = {};
    forEach(columns, (column: Table.PdfColumn<R, M>) => {
      if (!isNil(account[column.field as keyof Model.PdfAccount])) {
        row[column.field as keyof Model.PdfAccount] = account[column.field as keyof Model.PdfAccount];
      } else {
        row[column.field as keyof Model.PdfAccount] = null;
      }
    });
    return row as Table.ModelRow<R>;
  }, [account, columns]);

  const generateRows = hooks.useDynamicCallback((): JSX.Element[] => {
    const createSubAccountFooterRow = (subaccount: M) => {
      return reduce(
        columns,
        (obj: { [key: string]: any }, col: Table.PdfColumn<R, M>) => {
          if (!isNil(col.childFooter) && !isNil(col.childFooter(subaccount).value)) {
            obj[col.field as string] = col.childFooter(subaccount).value;
          } else {
            obj[col.field as string] = null;
          }
          return obj;
        },
        {}
      ) as Table.ModelRow<R>;
    };

    const createSubAccountHeaderRow = (subaccount: M) => {
      return reduce(
        columns,
        (obj: { [key: string]: any }, col: Table.PdfColumn<R, M>) => {
          if (
            !isNil(subaccount[col.field as keyof M]) &&
            (subaccount.children.length === 0 || col.tableColumnType !== "calculated")
          ) {
            obj[col.field as string] = subaccount[col.field as keyof M];
          } else {
            obj[col.field as string] = null;
          }
          return obj;
        },
        {}
      ) as Table.ModelRow<R>;
    };

    const subaccounts = filter(
      account.children,
      (subaccount: M) => !(options.excludeZeroTotals === true) || model.businessLogic.estimatedValue(subaccount) !== 0
    );
    const table: Table.BodyRow<R>[] = tabling.data.createTableRows<R, M>({
      response: { models: subaccounts, groups: account.groups },
      columns
    });

    let runningIndex = 2;
    let rows = reduce(
      table,
      (rws: JSX.Element[], subAccountRow: Table.BodyRow<R>) => {
        runningIndex = runningIndex + 1;

        if (tabling.typeguards.isModelRow(subAccountRow)) {
          const subAccount: Model.PdfSubAccount | undefined = find(subaccounts, { id: subAccountRow.id });
          if (!isNil(subAccount)) {
            const details = subAccount.children;
            const showSubAccountFooterRow =
              filter(columns, (column: Table.PdfColumn<R, M>) => !isNil(column.childFooter)).length !== 0 &&
              details.length !== 0;
            // const isLastSubAccount = subaccountRowGroupIndex === subaccounts.length - 1;
            const isLastSubAccount = false;

            const subTable: Table.BodyRow<R>[] = tabling.data.createTableRows<R, M>({
              response: { models: details, groups: subAccount.groups },
              columns
            });

            let subRows: JSX.Element[] = reduce(
              subTable,
              (subRws: JSX.Element[], detailRow: Table.BodyRow<R>) => {
                runningIndex = runningIndex + 1;
                if (tabling.typeguards.isDataRow(detailRow)) {
                  return [
                    ...subRws,
                    <BodyRow<R, M>
                      key={runningIndex}
                      index={runningIndex}
                      columns={columns}
                      className={"detail-tr"}
                      row={detailRow}
                      cellProps={{
                        cellContentsVisible: (params: Table.PdfCellCallbackParams<R, M>) =>
                          params.column.field === "identifier" ? false : true,
                        textClassName: "detail-tr-td-text",
                        className: (params: Table.PdfCellCallbackParams<R, M>) => {
                          if (params.column.field === "description") {
                            return classNames("detail-td", "indent-td");
                          }
                          return "detail-td";
                        }
                      }}
                    />
                  ];
                } else if (tabling.typeguards.isGroupRow(detailRow)) {
                  return [
                    ...rws,
                    <GroupRow
                      className={"detail-group-tr"}
                      row={detailRow}
                      index={runningIndex}
                      key={runningIndex}
                      columns={columns}
                      columnIndent={1}
                      cellProps={{
                        textClassName: (params: Table.PdfCellCallbackParams<R, M>) => {
                          if (params.column.field === "description") {
                            return "detail-group-indent-td";
                          }
                          return "";
                        }
                      }}
                    />
                  ];
                }
                return rws;
              },
              [
                <BodyRow
                  key={runningIndex}
                  index={runningIndex}
                  cellProps={{ className: "subaccount-td", textClassName: "subaccount-tr-td-text" }}
                  className={"subaccount-tr"}
                  columns={columns}
                  row={createSubAccountHeaderRow(subAccount)}
                />
              ]
            );
            if (showSubAccountFooterRow === true) {
              const footerRow: Table.ModelRow<R> = createSubAccountFooterRow(subAccount);
              runningIndex = runningIndex + 1;
              subRows = [
                ...subRows,
                <BodyRow
                  key={runningIndex}
                  index={runningIndex}
                  className={"subaccount-footer-tr"}
                  cellProps={{ className: "subaccount-footer-td", textClassName: "subaccount-footer-tr-td-text" }}
                  columns={columns}
                  row={footerRow}
                  style={!isLastSubAccount ? { borderBottomWidth: 1 } : {}}
                />
              ];
            }
            return [...rws, ...subRows];
          }
          return rws;
        } else if (tabling.typeguards.isGroupRow(subAccountRow)) {
          return [...rws, <GroupRow row={subAccountRow} index={runningIndex} key={runningIndex} columns={columns} />];
        } else {
          return rws;
        }
      },
      [
        <HeaderRow className={"account-header-tr"} columns={columns} index={0} key={0} />,
        <BodyRow<R, M>
          key={1}
          index={1}
          className={"account-sub-header-tr"}
          cellProps={{ textClassName: "account-sub-header-tr-td-text" }}
          columns={columns}
          row={accountSubHeaderRow}
        />
      ]
    );
    if (showFooterRow === true) {
      runningIndex = runningIndex + 1;
      rows = [...rows, <FooterRow index={runningIndex} key={runningIndex} columns={columns} />];
    }
    return rows;
  });

  return <Table>{generateRows()}</Table>;
};

export default AccountTable;
