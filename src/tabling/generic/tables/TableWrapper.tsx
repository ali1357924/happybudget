import React from "react";
import classNames from "classnames";
import { isNil } from "lodash";

import { WrapInApplicationSpinner, ShowHide } from "components";

export type TableWrapperProps = {
  readonly id: string;
  readonly children: JSX.Element;
  readonly loading?: boolean | undefined;
  readonly menuPortalId?: string | undefined;
  readonly minimal?: boolean | undefined;
  readonly className?: Table.GeneralClassName;
  readonly footer?: JSX.Element;
  readonly showPageFooter?: boolean;
};

const TableWrapper = (props: TableWrapperProps) => (
  <WrapInApplicationSpinner hideWhileLoading={false} loading={props.loading}>
    <div className={classNames("table", "ag-theme-alpine", { "table--minimal": props.minimal }, props.className)}>
      <div
        id={props.id}
        className={classNames("core-table", {
          "with-page-footer": !isNil(props.footer) && props.showPageFooter === true,
          "with-table-menu": isNil(props.menuPortalId)
        })}
      >
        {props.children}
      </div>
      <ShowHide show={!isNil(props.footer) && props.showPageFooter === true}>
        <div className={"page-footer-grid-wrapper"}>
          <div style={{ flexGrow: 100 }}></div>
          {props.footer}
        </div>
      </ShowHide>
    </div>
  </WrapInApplicationSpinner>
);

export default React.memo(TableWrapper);
