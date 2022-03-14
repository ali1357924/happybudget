import { SagaIterator } from "redux-saga";
import { StrictEffect, call, put, fork, all } from "redux-saga/effects";
import { isNil, map, filter } from "lodash";

import * as api from "api";

import * as contacts from "../../contacts";
import * as notifications from "../../notifications";
import * as redux from "../../redux";
import * as tabling from "../../tabling";

type R = Tables.SubAccountRowData;
type C = Model.SubAccount;
type P = Http.SubAccountPayload;
type CTX = Redux.WithActionContext<Tables.SubAccountTableContext>;

export type PublicSubAccountsTableServiceSet = {
  readonly request: Http.DetailListService<C>;
  readonly requestGroups: Http.DetailListService<Model.Group>;
  readonly requestMarkups: Http.DetailListService<Model.Markup>;
};

export type AuthenticatedSubAccountsTableServiceSet<
  M extends Model.Account | Model.SubAccount,
  B extends Model.Template | Model.Budget
> = PublicSubAccountsTableServiceSet & {
  readonly create: Http.DetailPostService<C, P>;
  readonly bulkDelete: Http.TreeBulkDeleteService<B, M>;
  readonly bulkDeleteMarkups: Http.TreeBulkDeleteService<B, M>;
  readonly bulkUpdate: Http.TreeBulkUpdateService<B, M, C, P>;
  readonly bulkCreate: Http.TreeBulkCreateService<B, M, C, P>;
};

export type PublicSubAccountsTableActionMap = Redux.TableActionMap<C, Tables.SubAccountTableContext> & {
  readonly loadingBudget: Redux.ActionCreator<boolean>;
  readonly responseSubAccountUnits: Redux.ActionCreator<Http.ListResponse<Model.Tag>>;
  readonly responseFringes: Redux.ActionCreator<Http.TableResponse<Model.Fringe>>;
  readonly responseFringeColors: Redux.ActionCreator<Http.ListResponse<string>>;
};

export type AuthenticatedSubAccountsTableActionMap<
  M extends Model.Account | Model.SubAccount,
  B extends Model.Template | Model.Budget
> = Redux.AuthenticatedTableActionMap<R, C, Tables.SubAccountTableContext> & {
  readonly loadingBudget: Redux.ActionCreator<boolean>;
  readonly updateBudgetInState: Redux.ActionCreator<Redux.UpdateActionPayload<B>>;
  readonly updateParentInState: Redux.ActionCreator<Redux.UpdateActionPayload<M>>;
  readonly responseSubAccountUnits: Redux.ActionCreator<Http.ListResponse<Model.Tag>>;
  readonly responseFringes: Redux.ActionCreator<Http.TableResponse<Model.Fringe>>;
  readonly responseFringeColors: Redux.ActionCreator<Http.ListResponse<string>>;
};

export type PublicSubAccountsTableTaskConfig = Table.TaskConfig<
  R,
  C,
  Tables.SubAccountTableStore,
  Tables.SubAccountTableContext,
  PublicSubAccountsTableActionMap
> & {
  readonly services: PublicSubAccountsTableServiceSet;
};

export type AuthenticatedSubAccountsTableTaskConfig<
  M extends Model.Account | Model.SubAccount,
  B extends Model.Template | Model.Budget
> = Table.TaskConfig<
  R,
  C,
  Tables.SubAccountTableStore,
  Tables.SubAccountTableContext,
  AuthenticatedSubAccountsTableActionMap<M, B>
> & {
  readonly services: AuthenticatedSubAccountsTableServiceSet<M, B>;
};

export const createPublicTableTaskSet = (
  config: PublicSubAccountsTableTaskConfig
): Redux.TableTaskMap<Tables.SubAccountTableContext> => {
  function* requestFringes(ctx: CTX): SagaIterator {
    try {
      const response: Http.ListResponse<Model.Fringe> = yield api.request(api.getFringes, ctx, ctx.budgetId);
      yield put(config.actions.responseFringes({ models: response.data }));
    } catch (e: unknown) {
      /* TODO: It would be nice if we can show this in the Fringes table
         instead (if it is open). */
      config.table.handleRequestError(e as Error, {
        message: ctx.errorMessage || "There was an error retrieving the table data.",
        dispatchClientErrorToSentry: true
      });
      yield put(config.actions.responseFringes({ models: [] }));
    }
  }

  function* requestFringesColors(ctx: CTX): SagaIterator {
    try {
      const response = yield api.request(api.getFringeColors, ctx);
      yield put(config.actions.responseFringeColors(response));
    } catch (e: unknown) {
      config.table.handleRequestError(e as Error, {
        message: ctx.errorMessage || "There was an error retrieving the table data.",
        dispatchClientErrorToSentry: true
      });
      yield put(config.actions.responseFringeColors({ data: [], count: 0 }));
    }
  }

  function* requestSubAccountUnits(ctx: CTX): SagaIterator {
    try {
      const response = yield api.request(api.getSubAccountUnits, ctx);
      yield put(config.actions.responseSubAccountUnits(response));
    } catch (e: unknown) {
      config.table.handleRequestError(e as Error, {
        message: ctx.errorMessage || "There was an error retrieving the table data.",
        dispatchClientErrorToSentry: true
      });
      yield put(config.actions.responseSubAccountUnits({ data: [], count: 0 }));
    }
  }

  function* request(action: Redux.TableAction<Redux.TableRequestPayload, Tables.SubAccountTableContext>): SagaIterator {
    yield put(config.actions.loading(true));
    const effects = [
      api.request(config.services.request, action.context, action.context.id),
      api.request(config.services.requestGroups, action.context, action.context.id),
      api.request(config.services.requestMarkups, action.context, action.context.id)
    ];
    try {
      yield fork(requestSubAccountUnits, action.context);
      yield fork(requestFringes, action.context);
      yield fork(requestFringesColors, action.context);
      const [models, groups, markups]: [
        Http.ListResponse<C>,
        Http.ListResponse<Model.Group>,
        Http.ListResponse<Model.Markup>
      ] = yield all(effects);
      yield put(config.actions.response({ models: models.data, groups: groups.data, markups: markups.data }));
    } catch (e: unknown) {
      config.table.handleRequestError(e as Error, {
        message: action.context.errorMessage || "There was an error retrieving the table data.",
        dispatchClientErrorToSentry: true
      });
      yield put(config.actions.response({ models: [], markups: [], groups: [] }));
    } finally {
      yield put(config.actions.loading(false));
    }
  }
  return { request };
};

export const createAuthenticatedTableTaskSet = <
  M extends Model.Account | Model.SubAccount,
  B extends Model.Budget | Model.Template
>(
  config: AuthenticatedSubAccountsTableTaskConfig<M, B>
): Redux.AuthenticatedTableTaskMap<R, Tables.SubAccountTableContext> => {
  const contactsTasks = contacts.tasks.createTaskSet();

  function* requestFringes(ctx: CTX): SagaIterator {
    try {
      const response: Http.ListResponse<Model.Fringe> = yield api.request(api.getFringes, ctx, ctx.budgetId);
      if (response.data.length === 0) {
        // If there is no table data, we want to default create two rows.
        try {
          const bulkCreateResponse: Http.ServiceResponse<typeof api.bulkCreateFringes> = yield api.request(
            api.bulkCreateFringes,
            ctx,
            ctx.budgetId,
            { data: [{}, {}] }
          );
          yield put(config.actions.responseFringes({ models: bulkCreateResponse.children }));
          yield put(config.actions.updateBudgetInState({ id: ctx.budgetId, data: bulkCreateResponse.parent as B }));
        } catch (e: unknown) {
          /* TODO: It would be nice if we can show this in the Fringes table
             instead (if it is open). */
          config.table.handleRequestError(e as Error, {
            message: ctx.errorMessage || "There was an error retrieving the fringes table data.",
            dispatchClientErrorToSentry: true
          });
        }
      } else {
        yield put(config.actions.responseFringes({ models: response.data }));
      }
    } catch (e: unknown) {
      /* TODO: It would be nice if we can show this in the Fringes table
         instead (if it is open). */
      config.table.handleRequestError(e as Error, {
        message: ctx.errorMessage || "There was an error retrieving the fringes table data.",
        dispatchClientErrorToSentry: true
      });
      yield put(config.actions.responseFringes({ models: [] }));
    }
  }

  function* requestFringesColors(ctx: CTX): SagaIterator {
    try {
      const response = yield api.request(api.getFringeColors, ctx, {});
      yield put(config.actions.responseFringeColors(response));
    } catch (e: unknown) {
      config.table.handleRequestError(e as Error, {
        message: ctx.errorMessage || "There was an error retrieving the table data.",
        dispatchClientErrorToSentry: true
      });
      yield put(config.actions.responseFringeColors({ data: [], count: 0 }));
    }
  }

  function* requestSubAccountUnits(ctx: CTX): SagaIterator {
    try {
      const response = yield api.request(api.getSubAccountUnits, ctx);
      yield put(config.actions.responseSubAccountUnits(response));
    } catch (e: unknown) {
      config.table.handleRequestError(e as Error, {
        message: ctx.errorMessage || "There was an error retrieving the table data.",
        dispatchClientErrorToSentry: true
      });
      yield put(config.actions.responseSubAccountUnits({ data: [], count: 0 }));
    }
  }

  function* request(action: Redux.TableAction<Redux.TableRequestPayload, Tables.SubAccountTableContext>): SagaIterator {
    if (redux.typeguards.isListRequestIdsAction(action)) {
      const response: Http.ListResponse<Model.SubAccount> = yield api.request(
        config.services.request,
        action.context,
        action.context.id,
        { ids: action.payload.ids }
      );
      yield put(
        config.actions.handleEvent(
          {
            type: "modelsUpdated",
            payload: map(response.data, (m: Model.SubAccount) => ({ model: m }))
          },
          action.context
        )
      );
    } else {
      yield put(config.actions.loading(true));
      const effects = [
        api.request(config.services.request, action.context, action.context.id),
        api.request(config.services.requestGroups, action.context, action.context.id),
        api.request(config.services.requestMarkups, action.context, action.context.id)
      ];
      try {
        yield fork(contactsTasks.request, action as Redux.Action);
        yield fork(requestSubAccountUnits, action.context);
        yield fork(requestFringes, action.context);
        yield fork(requestFringesColors, action.context);
        const [models, groups, markups]: [
          Http.ListResponse<C>,
          Http.ListResponse<Model.Group>,
          Http.ListResponse<Model.Markup>
        ] = yield all(effects);
        if (models.data.length === 0) {
          // If there is no table data, we want to default create two rows.
          try {
            const response: Http.ServiceResponse<typeof config.services.bulkCreate> = yield api.request(
              config.services.bulkCreate,
              action.context,
              action.context.id,
              { data: [{}, {}] }
            );
            yield put(
              config.actions.response({ models: response.children, groups: groups.data, markups: markups.data })
            );
          } catch (e: unknown) {
            config.table.handleRequestError(e as Error, {
              message: action.context.errorMessage || "There was an error retrieving the table data.",
              dispatchClientErrorToSentry: true
            });
          }
        } else {
          yield put(config.actions.response({ models: models.data, groups: groups.data, markups: markups.data }));
        }
      } catch (e: unknown) {
        const err = e as Error;
        if (
          err instanceof api.ClientError &&
          !isNil(err.permissionError) &&
          err.permissionError.code === api.ErrorCodes.PRODUCT_PERMISSION_ERROR
        ) {
          notifications.ui.banner.lookupAndNotify("budgetSubscriptionPermissionError");
        } else {
          config.table.handleRequestError(e as Error, {
            message: action.context.errorMessage || "There was an error retrieving the table data.",
            dispatchClientErrorToSentry: true
          });
        }
        yield put(config.actions.response({ models: [], markups: [], groups: [] }));
      } finally {
        yield put(config.actions.loading(false));
      }
    }
  }

  const bulkCreateTask: (e: Table.RowAddEvent<R>, ctx: CTX) => SagaIterator = tabling.tasks.createBulkTask({
    table: config.table,
    service: config.services.bulkCreate,
    selectStore: config.selectStore,
    responseActions: (ctx: CTX, r: Http.AncestryListResponse<B, M, C>, e: Table.RowAddEvent<R>) => [
      config.actions.updateBudgetInState({ id: r.budget.id, data: r.budget }),
      config.actions.updateParentInState({ id: r.parent.id, data: r.parent }),
      config.actions.handleEvent(
        {
          type: "placeholdersActivated",
          payload: { placeholderIds: e.placeholderIds, models: r.children }
        },
        ctx
      )
    ],
    performCreate: (
      ctx: CTX,
      p: Http.BulkCreatePayload<Http.SubAccountPayload>
    ): [number, Http.BulkCreatePayload<Http.SubAccountPayload>] => [ctx.id, p]
  });

  function* bulkUpdateTask(
    ctx: CTX,
    requestPayload: Http.BulkUpdatePayload<Http.AccountPayload>,
    isGroupEvent = false
  ): SagaIterator {
    config.table.saving(true);
    if (!isGroupEvent) {
      yield put(config.actions.loadingBudget(true));
    }
    try {
      const response: Http.ServiceResponse<typeof config.services.bulkUpdate> = yield api.request(
        config.services.bulkUpdate,
        ctx,
        ctx.id,
        requestPayload
      );
      yield put(config.actions.updateBudgetInState({ id: response.budget.id, data: response.budget }));
      yield put(config.actions.updateParentInState({ id: response.parent.id, data: response.parent }));
    } catch (err: unknown) {
      config.table.handleRequestError(err as Error, {
        message: ctx.errorMessage || "There was an error updating the table rows.",
        dispatchClientErrorToSentry: true
      });
    } finally {
      yield put(config.actions.loadingBudget(false));
      config.table.saving(false);
    }
  }

  function* updateMarkupTask(ctx: CTX, changes: Table.RowChange<R, Table.MarkupRow<R>>[]): SagaIterator {
    if (changes.length !== 0) {
      const effects: (StrictEffect | null)[] = map(changes, (ch: Table.RowChange<R, Table.MarkupRow<R>>) => {
        const payload = tabling.rows.patchPayload<R, C, Http.MarkupPayload>(ch, config.table.getColumns());
        if (!isNil(payload)) {
          return api.request(api.updateMarkup, ctx, tabling.rows.markupId(ch.id), payload);
        }
        return null;
      });
      const validEffects: StrictEffect[] = filter(
        effects,
        (eff: StrictEffect | null) => eff !== null
      ) as StrictEffect[];

      config.table.saving(true);
      try {
        /*
        Note: We will have access to the updated parent and budget for each
				request made to update a specific markup - however, the budget or parent
				will only change when the unit/rate fields are updated for the Markup
				via the Modal (not the table) - so we do not have to be concerned
        with updating the budget or parent in state here.
        */
        yield all(validEffects);
      } catch (err: unknown) {
        config.table.handleRequestError(err as Error, {
          message: ctx.errorMessage || "There was an error updating the table rows.",
          dispatchClientErrorToSentry: true
        });
      } finally {
        config.table.saving(false);
      }
    }
  }

  function* deleteGroups(ctx: CTX, ids: number[]): SagaIterator {
    yield all(map(ids, (id: number) => api.request(api.deleteGroup, ctx, id)));
  }

  function* bulkDeleteRows(ctx: CTX, ids: number[], markupIds?: number[]): SagaIterator {
    /* Note: We have do these operations sequentially, since they will both
			 update the Budget in state and we cannot risk running into race
			 conditions. */
    let response: Http.ServiceResponse<typeof config.services.bulkDelete> | null = null;
    if (ids.length !== 0) {
      response = yield api.request(config.services.bulkDelete, ctx, ctx.id, { ids });
    }
    if (!isNil(markupIds) && markupIds.length !== 0 && !isNil(config.services.bulkDeleteMarkups)) {
      response = yield api.request(config.services.bulkDeleteMarkups, ctx, ctx.id, { ids: markupIds });
    }
    if (!isNil(response)) {
      yield put(config.actions.updateParentInState({ id: response.parent.id, data: response.parent }));
      yield put(config.actions.updateBudgetInState({ id: response.budget.id, data: response.budget }));
    }
  }

  function* handleRemoveRowFromGroupEvent(e: Table.RowRemoveFromGroupEvent, ctx: CTX): SagaIterator {
    const ids = Array.isArray(e.payload.rows) ? e.payload.rows : [e.payload.rows];
    const requestPayload: Http.BulkUpdatePayload<P> = {
      data: map(ids, (id: Table.ModelRowId) => ({
        id,
        group: null
      }))
    };
    yield fork(
      bulkUpdateTask,
      { errorMessage: "There was an error removing the row from the group.", ...ctx },
      requestPayload,
      true
    );
  }

  function* handleAddRowToGroupEvent(e: Table.RowAddToGroupEvent, ctx: CTX): SagaIterator {
    const ids = Array.isArray(e.payload.rows) ? e.payload.rows : [e.payload.rows];
    const requestPayload: Http.BulkUpdatePayload<P> = {
      data: map(ids, (id: Table.ModelRowId) => ({
        id,
        group: tabling.rows.groupId(e.payload.group)
      }))
    };
    yield fork(
      bulkUpdateTask,
      { errorMessage: "There was an error adding the row to the group.", ...ctx },
      requestPayload,
      true
    );
  }

  function* handleRowInsertEvent(e: Table.RowInsertEvent<R>, ctx: CTX): SagaIterator {
    config.table.saving(true);
    try {
      const response: C = yield api.request(config.services.create, ctx, ctx.id, {
        previous: e.payload.previous,
        group: isNil(e.payload.group) ? null : tabling.rows.groupId(e.payload.group),
        ...tabling.rows.postPayload<R, C, P>(e.payload.data, config.table.getColumns())
      });
      /* The Group is not attributed to the Model in a detail response, so
				 if the group did change we have to use the value from the event
				 payload. */
      yield put(
        config.actions.handleEvent(
          {
            type: "modelsAdded",
            payload: {
              model: response,
              group: !isNil(e.payload.group) ? tabling.rows.groupId(e.payload.group) : null
            }
          },
          ctx
        )
      );
    } catch (err: unknown) {
      config.table.handleRequestError(err as Error, {
        message: ctx.errorMessage || "There was an error adding the table rows.",
        dispatchClientErrorToSentry: true
      });
    } finally {
      config.table.saving(false);
    }
  }

  function* handleRowPositionChangedEvent(e: Table.RowPositionChangedEvent, ctx: CTX): SagaIterator {
    config.table.saving(true);
    try {
      const response: C = yield api.request(api.updateSubAccount, ctx, e.payload.id, {
        previous: e.payload.previous,
        group: isNil(e.payload.newGroup) ? null : tabling.rows.groupId(e.payload.newGroup)
      });
      /* The Group is not attributed to the Model in a detail response, so if
				 the group did change we have to use the value from the event
				 payload. */
      yield put(
        config.actions.handleEvent(
          {
            type: "modelsUpdated",
            payload: {
              model: response,
              group: !isNil(e.payload.newGroup) ? tabling.rows.groupId(e.payload.newGroup) : null
            }
          },
          ctx
        )
      );
    } catch (err: unknown) {
      config.table.handleRequestError(err as Error, {
        message: ctx.errorMessage || "There was an error moving the table rows.",
        dispatchClientErrorToSentry: true
      });
    } finally {
      config.table.saving(false);
    }
  }

  function* handleRowAddEvent(e: Table.RowAddEvent<R>, ctx: CTX): SagaIterator {
    if (!isNil(bulkCreateTask)) {
      yield fork(bulkCreateTask, e, ctx);
    }
  }

  function* handleRowDeleteEvent(e: Table.RowDeleteEvent, ctx: CTX): SagaIterator {
    const ids: Table.RowId[] = Array.isArray(e.payload.rows) ? e.payload.rows : [e.payload.rows];
    if (ids.length !== 0) {
      yield put(config.actions.loadingBudget(true));
      config.table.saving(true);

      const modelRowIds = filter(ids, (id: Table.RowId) => tabling.rows.isModelRowId(id)) as number[];

      const markupRowIds = map(
        filter(ids, (id: Table.RowId) => tabling.rows.isMarkupRowId(id)) as Table.MarkupRowId[],
        (id: Table.MarkupRowId) => tabling.rows.markupId(id)
      ) as number[];

      const groupRowIds = map(
        filter(ids, (id: Table.RowId) => tabling.rows.isGroupRowId(id)) as Table.GroupRowId[],
        (id: Table.GroupRowId) => tabling.rows.groupId(id)
      );

      try {
        yield all([call(deleteGroups, ctx, groupRowIds), call(bulkDeleteRows, ctx, modelRowIds, markupRowIds)]);
      } catch (err: unknown) {
        config.table.handleRequestError(err as Error, {
          message: ctx.errorMessage || "There was an error removing the table rows.",
          dispatchClientErrorToSentry: true
        });
      } finally {
        config.table.saving(false);
        yield put(config.actions.loadingBudget(false));
      }
    }
  }

  function* handleDataChangeEvent(e: Table.DataChangeEvent<R>, ctx: CTX): SagaIterator {
    const merged = tabling.events.consolidateRowChanges<R>(e.payload);

    const markupChanges: Table.RowChange<R, Table.MarkupRow<R>>[] = filter(merged, (value: Table.RowChange<R>) =>
      tabling.rows.isMarkupRowId(value.id)
    ) as Table.RowChange<R, Table.MarkupRow<R>>[];

    const dataChanges: Table.RowChange<R, Table.ModelRow<R>>[] = filter(merged, (value: Table.RowChange<R>) =>
      tabling.rows.isModelRowId(value.id)
    ) as Table.RowChange<R, Table.ModelRow<R>>[];
    yield fork(updateMarkupTask, ctx, markupChanges);
    if (dataChanges.length !== 0) {
      const requestPayload = tabling.rows.createBulkUpdatePayload<R, C, P>(dataChanges, config.table.getColumns());
      if (requestPayload.data.length !== 0) {
        yield call(bulkUpdateTask, ctx, requestPayload);
      }
    }
  }

  return {
    request,
    handleChangeEvent: tabling.tasks.createChangeEventHandler<R, Tables.SubAccountTableContext>({
      rowRemoveFromGroup: handleRemoveRowFromGroupEvent,
      rowInsert: handleRowInsertEvent,
      rowAddToGroup: handleAddRowToGroupEvent,
      rowAdd: handleRowAddEvent,
      rowDelete: handleRowDeleteEvent,
      dataChange: handleDataChangeEvent,
      rowPositionChanged: handleRowPositionChangedEvent
    })
  };
};
