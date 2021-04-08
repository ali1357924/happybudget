/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
namespace Table {
  interface CellError {
    readonly id: number;
    readonly field: string;
    readonly error: string;
  }

  type RowType = "subaccount" | "account" | "fringe" | "actual";

  interface RowMeta<C extends Model = UnknownModel> {
    readonly selected: boolean;
    readonly errors: CellError[];
    readonly isPlaceholder?: boolean;
    readonly isGroupFooter?: boolean;
    readonly isTableFooter?: boolean;
    readonly isBudgetFooter?: boolean;
    readonly children: C[];
    readonly label: string;
    readonly typeLabel: string;
    readonly fieldsLoading: string[];
    readonly type: RowType;
  }

  interface PageAndSize {
    readonly page: number;
    readonly pageSize: number;
  }

  interface Row<G extends IGroup<any>, C extends Model = UnknownModel> {
    readonly id: number;
    readonly meta: RowMeta<C>;
    readonly group: G | null;
  }

  interface CellChange {
    oldValue: string | number | number[] | string[] | null;
    newValue: string | number | number[] | string[];
  }

  type RowChange = {
    id: number;
    data: { [key: string]: CellChange };
  };

  interface ActivatePlaceholderPayload<M> {
    readonly id: number;
    readonly model: M;
  }

  interface AccountRow extends Row<IGroup<ISimpleAccount>, ISimpleSubAccount> {
    readonly identifier: string | null;
    readonly description: string | null;
    readonly estimated: number | null;
    readonly variance: number | null;
    readonly actual: number | null;
  }

  interface SubAccountRow extends Row<IGroup<ISimpleSubAccount>, ISimpleSubAccount> {
    readonly identifier: string | null;
    readonly name: string | null;
    readonly description: string | null;
    readonly quantity: number | null;
    readonly unit: SubAccountUnit | null;
    readonly multiplier: number | null;
    readonly rate: number | null;
    readonly actual: number | null;
    readonly estimated: number | null;
    readonly variance: number | null;
    readonly fringes: number[];
  }

  interface FringeRow extends Row<IGroup<any>> {
    readonly name: string | null;
    readonly description: string | null;
    readonly cutoff: number | null;
    readonly rate: number | null;
    readonly unit: FringeUnit;
  }

  interface ActualRow extends Row<IGroup<any>> {
    readonly object_id: number | null;
    readonly parent_type: BudgetItemType | null;
    readonly description: string | null;
    readonly vendor: string | null;
    readonly purchase_order: string | null;
    readonly date: string | null;
    readonly payment_method: PaymentMethod | null;
    readonly payment_id: string | null;
    readonly value: string | null;
  }
}
