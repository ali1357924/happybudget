import { Required } from "utility-types";

import { ApiDetail } from "application/api/types";
import { http, feedback } from "lib";

import * as codes from "../codes";
import * as errorTypes from "../errorTypes";
import { ErrorMessageScopes, getErrorMessage, HTTP_MESSAGE, HTTP_USER_MESSAGE } from "../messages";

type HttpErrorBaseConfig<E extends errorTypes.HttpErrorType> = Readonly<{
  readonly errorType: E;
  readonly message?: string;
  readonly userMessage?: string;
  readonly url: string;
  readonly method: http.HttpMethod;
}>;

export interface IBaseHttpError {
  readonly message: string;
  readonly userMessage: string;
  readonly url: string;
  readonly method: http.HttpMethod;
}

/**
 * Base class for all HTTP request errors that occur when an internal request between the client and
 * the server fails.
 *
 * @param {string} url The URL that the request was made to when the error occurred.
 *
 * @param {number} status
 *   For cases where the request failed but a {@link Response} was still received, the status code
 *   of that {@link Response}.
 *
 * @param {errorTypes.RequestMethodType} method
 *   The {@link errorTypes.RequestMethodType} of the request that was made.
 *
 * @param {string} message
 *   The string representation of the {@link BaseHttpError} that *should only be referenced in
 *   logs*.  This is not a message that should ever be provided outwardly to a user.
 *
 * @param {string} userMessage
 *   The string representation of the {@link BaseHttpError} that should be used when, if
 *   contextually applicable, communicating the error to a user.
 */
abstract class BaseHttpError<E extends errorTypes.HttpErrorType>
  extends Error
  implements IBaseHttpError
{
  public readonly userMessage: string;
  public readonly url: string;
  public readonly method: http.HttpMethod;

  protected constructor(config: Required<HttpErrorBaseConfig<E>, "userMessage" | "message">) {
    super(config.message);
    this.url = config.url;
    this.method = config.method;
    this.userMessage = config.userMessage;
    this.message = config.message;
  }
}

/**
 * A {@link NetworkError} is used to model an error that occurs when an HTTP request is made between
 * the client and server and a {@link Response} is not received.
 */
export class NetworkError extends BaseHttpError<typeof errorTypes.HttpErrorTypes.NETWORK> {
  constructor(
    config: Omit<HttpErrorBaseConfig<typeof errorTypes.HttpErrorTypes.NETWORK>, "errorType">,
  ) {
    super({
      userMessage: getErrorMessage(codes.NetworkErrorCodes.NETWORK, {
        scope: ErrorMessageScopes.USER,
      }),
      ...config,
      message: HTTP_MESSAGE.format({
        url: config.url,
        method: config.method,
        reason: config.message || "There was a network error.",
      }),
      errorType: errorTypes.HttpErrorTypes.NETWORK,
    });
  }

  public toFeedback = (): feedback.GlobalFeedback<typeof feedback.FeedbackTypes.ERROR> => ({
    message: this.userMessage,
    feedbackType: feedback.FeedbackTypes.ERROR,
  });
}

/**
 * An abstract base class that is used to model errors that occurs when an HTTP request is made
 * between the client and server and a {@link Response} is received.
 */
export abstract class AbstractApiError<
  D extends typeof errorTypes.HttpErrorTypes.FIELD | typeof errorTypes.HttpErrorTypes.GLOBAL,
> extends BaseHttpError<D> {
  public readonly status: number;

  constructor(
    config: Required<HttpErrorBaseConfig<D>, "message" | "userMessage"> & {
      readonly status: number;
    },
  ) {
    super(config);
    this.status = config.status;
  }
}

/**
 * A {@link ApiFieldError} is used to model an error that occurs when an HTTP request is made
 * between the client and server and the received {@link Response} indicates that the error or
 * errors are pertinent to fields of the submitted data.
 *
 * When the {@link ApiFieldError} is used, the data embedded in the JSON response body will have
 * one or multiple sub-errors, or details, each of which corresponds to an error pertinent to a
 * specific field.  The top level error messages on the {@link ApiFieldError} message will be
 * generalizations of the individual field-level errors that occurred - and when communicating
 * errors to a user, the individual details {@link errorTypes.ApiDetail[]} that exist on the
 * 'errors' attribute of the {@link ApiFieldError} object should be used.
 */
export class ApiFieldError extends AbstractApiError<typeof errorTypes.HttpErrorTypes.FIELD> {
  public errors: Required<
    ApiDetail<typeof errorTypes.HttpErrorTypes.FIELD>,
    "message" | "userMessage"
  >[];

  constructor({
    message,
    ...config
  }: Omit<HttpErrorBaseConfig<typeof errorTypes.HttpErrorTypes.FIELD>, "errorType"> & {
    readonly status: number;
    readonly errors: ApiDetail<typeof errorTypes.HttpErrorTypes.FIELD>[];
  }) {
    const HttpContext = { url: config.url, status: config.status, method: config.method };

    /* At this point, the provided details (or errors) will be guaranteed to have just a code and
       a field.  They may optionally have a 'userMessage' or 'message' attribute, but if they do not
       those attributes should be determined from the code. */
    const standardizedDetails = config.errors.map(
      ({
        message,
        userMessage,
        code,
        field,
        ...context
      }: ApiDetail<typeof errorTypes.HttpErrorTypes.FIELD>) => ({
        field,
        /* We do not need to include additional message context such as the url, status or method
           because those are only pertinent for generating internal log messages and that info
           should not be outwardly displayed to a user. */
        userMessage:
          userMessage || getErrorMessage(code, { ...context, scope: ErrorMessageScopes.USER }),
        message:
          message ||
          getErrorMessage(code, {
            scope: ErrorMessageScopes.INTERNAL,
            ...HttpContext,
            ...context,
          }),
        code,
      }),
    );
    super({
      userMessage: HTTP_USER_MESSAGE.format(),
      ...config,
      /* When a ApiFieldError is being used to model an error that occurs, the data that the
         response contains may have one or more details (or errors), each of which has its own
         individual code and optional message.  So the ApiFieldError's internal message, used for
         logging purposes, will be a combination of the top level error message combined with string
         representations of the details in the response body. */
      message: HTTP_MESSAGE.format({
        ...HttpContext,
        reason: message,
        details: standardizedDetails,
      }),
      errorType: errorTypes.HttpErrorTypes.FIELD,
    });
    /* The 'errors' on the ApiFieldError object will each correspond to a given field of the data
       that was submitted, and will be used to render feedback next to the individual fields of a
       Form or other element that handles data submission. */
    this.errors = standardizedDetails;
  }

  public toFeedback = <N extends string = string>(): feedback.FieldFeedback<
    typeof feedback.FeedbackTypes.ERROR,
    N
  >[] =>
    this.errors.map(
      (
        e: Required<ApiDetail<typeof errorTypes.HttpErrorTypes.FIELD>, "message" | "userMessage">,
      ) => ({
        field: e.field as N,
        message: e.userMessage,
        feedbackType: feedback.FeedbackTypes.ERROR,
      }),
    );
}

export class ApiGlobalError extends AbstractApiError<typeof errorTypes.HttpErrorTypes.GLOBAL> {
  public code: ApiDetail<typeof errorTypes.HttpErrorTypes.GLOBAL>["code"];

  constructor({
    message,
    ...config
  }: Omit<HttpErrorBaseConfig<typeof errorTypes.HttpErrorTypes.GLOBAL>, "errorType"> & {
    readonly status: number;
    readonly code: ApiDetail<typeof errorTypes.HttpErrorTypes.GLOBAL>["code"];
  }) {
    const HttpContext = { url: config.url, status: config.status, method: config.method };
    super({
      /* We do not need to include additional message context such as the url, status or method
         because those are only pertinent for generating internal log messages and that info should
         not be outwardly displayed to a user. */
      userMessage: getErrorMessage(config.code, { scope: ErrorMessageScopes.USER }),
      ...config,
      message: HTTP_MESSAGE.format({
        ...HttpContext,
        code: config.code,
        reason:
          message ||
          getErrorMessage(config.code, {
            scope: ErrorMessageScopes.INTERNAL,
          }),
      }),
      errorType: errorTypes.HttpErrorTypes.GLOBAL,
    });
    this.code = config.code;
  }

  public toFeedback = (): feedback.GlobalFeedback<typeof feedback.FeedbackTypes.ERROR> => ({
    message: this.userMessage,
    feedbackType: feedback.FeedbackTypes.ERROR,
  });
}

export type ApiError = ApiFieldError | ApiGlobalError;
export type HttpError = NetworkError | ApiError;
export type GlobalFeedbackError = NetworkError | ApiGlobalError;
export type FieldFeedbackError = ApiFieldError;

export const isApiError = (e: HttpError | Error): e is ApiError =>
  e instanceof ApiFieldError || e instanceof ApiGlobalError;

export const isApiFieldError = (e: HttpError | Error): e is ApiFieldError =>
  e instanceof ApiFieldError;

export const isApiGlobalError = (e: HttpError | Error): e is ApiGlobalError =>
  e instanceof ApiGlobalError;

export const isNetworkError = (e: HttpError | Error): e is NetworkError =>
  e instanceof NetworkError;

export const isHttpError = (e: HttpError | Error): e is HttpError =>
  e instanceof NetworkError || isApiError(e);

export const isGlobalFeedbackError = (e: HttpError | Error | unknown): e is GlobalFeedbackError =>
  e instanceof Error && (isNetworkError(e) || isApiGlobalError(e));

export const isFieldFeedbackError = (e: HttpError | Error | unknown): e is FieldFeedbackError =>
  e instanceof Error && isApiFieldError(e);
