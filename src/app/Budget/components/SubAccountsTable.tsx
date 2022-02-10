import React, { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { isNil, filter } from "lodash";

import { tabling, contacts } from "lib";
import { actions } from "store";

import { useContacts, CreateContactParams, EditContactParams } from "components/hooks";
import { SubAccountsTable as GenericSubAccountsTable } from "tabling";

import { selectors } from "../store";
import FringesModal from "./FringesModal";

type R = Tables.SubAccountRowData;

type OmitTableProps =
  | "contacts"
  | "onEditContact"
  | "onNewContact"
  | "menuPortalId"
  | "columns"
  | "fringes"
  | "subAccountUnits"
  | "onEditFringes"
  | "onAddFringes"
  | "onExportPdf"
  | "onSearchContact";

export interface BudgetSubAccountsTableProps
  extends Omit<GenericSubAccountsTable.AuthenticatedBudgetProps, OmitTableProps> {
  readonly budgetId: number;
  readonly actionContext: Tables.SubAccountTableContext;
  // The ID of either the Account or SubAccount.
  readonly id: number;
  readonly parentType: "account" | "subaccount";
  readonly budget: Model.Budget | null;
  readonly setPreviewModalVisible: (v: boolean) => void;
}

const SubAccountsTable = ({
  id,
  budget,
  budgetId,
  parentType,
  setPreviewModalVisible,
  ...props
}: BudgetSubAccountsTableProps): JSX.Element => {
  const [fringesModalVisible, setFringesModalVisible] = useState(false);
  const fringesTable = tabling.hooks.useTable<Tables.FringeRowData, Model.Fringe>();

  const dispatch = useDispatch();
  const cs = contacts.hooks.useContacts();
  const fringes = useSelector((s: Application.Store) => selectors.selectFringes(s, parentType));
  const subaccountUnits = useSelector((s: Application.Store) => selectors.selectSubAccountUnits(s, parentType));

  const onContactCreated = useMemo(
    () => (m: Model.Contact, params?: CreateContactParams) => {
      dispatch(actions.authenticated.addContactToStateAction(m));
      /* If we have enough information from before the contact was created in
			   the specific cell, combine that information with the new value to
				 perform a table update, showing the created contact in the new cell. */
      const rowId = params?.rowId;
      if (!isNil(rowId)) {
        const row: Table.BodyRow<R> | null = props.table.current.getRow(rowId);
        if (!isNil(row) && tabling.typeguards.isModelRow(row)) {
          let rowChange: Table.RowChange<R, Table.ModelRow<R>> = {
            id: row.id,
            data: { contact: { oldValue: row.data.contact || null, newValue: m.id } }
          };
          /* If the Row does not already specify a rate and the Contact does
						 specify a rate, use the rate that is specified for the Contact. */
          if (m.rate !== null && row.data.rate === null) {
            rowChange = {
              ...rowChange,
              data: { ...rowChange.data, rate: { oldValue: row.data.rate, newValue: m.rate } }
            };
          }
          props.table.current.applyTableChange({
            type: "dataChange",
            payload: rowChange
          });
        }
      }
    },
    [props.table.current]
  );

  const onContactUpdated = useMemo(
    () => (m: Model.Contact, params: EditContactParams) => {
      dispatch(actions.authenticated.updateContactInStateAction({ id: m.id, data: m }));
      const rowId = params.rowId;
      if (!isNil(rowId)) {
        const row: Table.BodyRow<R> | null = props.table.current.getRow(rowId);
        if (!isNil(row) && tabling.typeguards.isModelRow(row) && row.data.rate === null && m.rate !== null) {
          props.table.current.applyTableChange({
            type: "dataChange",
            payload: {
              id: row.id,
              data: { rate: { oldValue: row.data.rate, newValue: m.rate } }
            }
          });
        }
      }
    },
    [props.table.current]
  );

  const [createContactModal, editContactModal, editContact, createContact] = useContacts({
    onCreated: onContactCreated,
    onUpdated: onContactUpdated
  });

  return (
    <React.Fragment>
      <GenericSubAccountsTable.AuthenticatedBudget
        {...props}
        contacts={cs}
        menuPortalId={"supplementary-header"}
        savingChangesPortalId={"saving-changes"}
        onEditContact={(params: { contact: number; rowId: Table.ModelRowId }) =>
          editContact({ id: params.contact, rowId: params.rowId })
        }
        onExportPdf={() => setPreviewModalVisible(true)}
        subAccountUnits={subaccountUnits}
        onAddFringes={() => setFringesModalVisible(true)}
        onEditFringes={() => setFringesModalVisible(true)}
        fringes={
          filter(fringes, (f: Table.BodyRow<Tables.FringeRowData>) =>
            tabling.typeguards.isModelRow(f)
          ) as Tables.FringeRow[]
        }
        onSearchContact={(v: string) => dispatch(actions.authenticated.setContactsSearchAction(v, { id, budgetId }))}
        onNewContact={(params: { name?: string; rowId: Table.ModelRowId }) => createContact(params)}
      />
      {createContactModal}
      {editContactModal}
      <FringesModal
        budgetId={budgetId}
        table={fringesTable}
        id={id}
        budget={budget}
        open={fringesModalVisible}
        parentType={parentType}
        onCancel={() => setFringesModalVisible(false)}
      />
    </React.Fragment>
  );
};

export default SubAccountsTable;
