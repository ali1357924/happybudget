import { isNil } from "lodash";
import { tabling, budgeting } from "lib";

export const AccountColumns: Table.PdfColumn<Tables.PdfAccountRowData, Model.PdfAccount>[] = [
  {
    domain: "pdf",
    field: "identifier",
    headerName: "Acct #",
    columnType: "text",
    width: 0.1,
    tableColumnType: "body",
    cellProps: { style: { borderRightWidth: 1 }, textStyle: { textAlign: "center" } }
  },
  {
    domain: "pdf",
    field: "description",
    headerName: "Category Description",
    columnType: "longText",
    width: 0.75,
    tableColumnType: "body",
    footer: {
      value: "Grand Total"
    },
    valueGetter: (r: Table.BodyRow<Tables.PdfAccountRowData>) => {
      if (tabling.typeguards.isGroupRow(r)) {
        return r.groupData.name;
      }
      return r.data.description || "";
    }
  },
  { domain: "pdf", field: "nominal_value", tableColumnType: "fake" },
  { domain: "pdf", field: "markup_contribution", tableColumnType: "fake" },
  { domain: "pdf", field: "accumulated_fringe_contribution", tableColumnType: "fake" },
  { domain: "pdf", field: "accumulated_markup_contribution", tableColumnType: "fake" },
  {
    domain: "pdf",
    colId: "estimated",
    headerName: "Estimated",
    tableColumnType: "calculated",
    columnType: "sum",
    formatter: tabling.formatters.currencyValueFormatter,
    width: 0.15,
    valueGetter: budgeting.valueGetters.estimatedValueGetter
  }
];

export const SubAccountColumns: Table.PdfColumn<Tables.PdfSubAccountRowData, Model.PdfSubAccount>[] = [
  {
    domain: "pdf",
    field: "identifier",
    columnType: "number",
    headerName: "Acct",
    width: 0.1,
    tableColumnType: "body",
    cellProps: { style: { borderRightWidth: 1 }, textStyle: { textAlign: "center" } }
  },
  {
    domain: "pdf",
    field: "description",
    headerName: "Description",
    columnType: "longText",
    width: 0.3,
    tableColumnType: "body",
    valueGetter: (r: Table.BodyRow<Tables.PdfSubAccountRowData>) => {
      if (tabling.typeguards.isGroupRow(r)) {
        return r.groupData.name;
      }
      return r.data.description || "";
    }
  },
  {
    domain: "pdf",
    field: "contact",
    headerName: "Contact",
    columnType: "contact",
    width: 0.1,
    tableColumnType: "body"
  },
  {
    domain: "pdf",
    field: "quantity",
    headerName: "Qty",
    columnType: "number",
    width: 0.1,
    tableColumnType: "body"
  },
  {
    domain: "pdf",
    field: "unit",
    headerName: "Unit",
    columnType: "singleSelect",
    width: 0.1,
    tableColumnType: "body"
  },
  {
    domain: "pdf",
    field: "multiplier",
    headerName: "X",
    columnType: "number",
    width: 0.1,
    tableColumnType: "body"
  },
  {
    domain: "pdf",
    field: "rate",
    headerName: "Rate",
    formatter: tabling.formatters.currencyValueFormatter,
    columnType: "currency",
    width: 0.1,
    tableColumnType: "body"
  },
  {
    domain: "pdf",
    colId: "estimated",
    headerName: "Total",
    tableColumnType: "calculated",
    columnType: "sum",
    width: 0.1,
    formatter: (params: Table.NativeFormatterParams<string | number>) =>
      isNil(params) || params === "" ? "0.00" : tabling.formatters.currencyValueFormatter(params),
    valueGetter: budgeting.valueGetters.estimatedValueGetter
  },
  { domain: "pdf", field: "nominal_value", tableColumnType: "fake" },
  { domain: "pdf", field: "markup_contribution", tableColumnType: "fake" },
  { domain: "pdf", field: "fringe_contribution", tableColumnType: "fake" },
  { domain: "pdf", field: "accumulated_fringe_contribution", tableColumnType: "fake" },
  { domain: "pdf", field: "accumulated_markup_contribution", tableColumnType: "fake" }
];
