import { SagaIterator } from "redux-saga";
import { put } from "redux-saga/effects";
import { forEach } from "lodash";

import { ClientError, handleRequestError } from "api";
import { DISPLAY_ERRORS_IN_TABLE } from "config";

export function* handleTableErrors(
  e: Error,
  message: string,
  id: number,
  action: (errors: Table.CellError[]) => Redux.IAction<any>
): SagaIterator {
  if (e instanceof ClientError) {
    const cellErrors: Table.CellError[] = [];
    forEach(e.errors, (errors: Http.ErrorDetail[] | Http.FieldErrors, field: string) => {
      // Just check the first level - subsequent nested levels are usually for errors with M2M fields
      // which are out of scope for now.
      if (Array.isArray(errors)) {
        cellErrors.push({
          id: id,
          // TODO: We might want to build in a way to capture multiple errors for the cell.
          error: errors[0].message,
          // TODO: Should we make sure the field exists as a cell?  Instead of force
          // coercing here?
          field: field
        });
      }
    });
    if (cellErrors.length === 0) {
      handleRequestError(e, message);
    } else {
      /* @ts-ignore 2367 */
      if (DISPLAY_ERRORS_IN_TABLE === true) {
        yield put(action(cellErrors));
      } else {
        handleRequestError(e, message);
      }
    }
  } else {
    handleRequestError(e, message);
  }
}
