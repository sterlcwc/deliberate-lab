/** Util functions to manipulate Angular constructs */

import { Signal, WritableSignal, computed, effect, signal, untracked } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  CheckQuestionAnswer,
  QuestionAnswer,
  QuestionConfig,
  RatingQuestionAnswer,
  ScaleQuestionAnswer,
  SurveyQuestionKind,
  TextQuestionAnswer,
  assertCastOrUndefined,
} from '@llm-mediation-experiments/utils';
import { Observable, map } from 'rxjs';

/** Extract a route parameter as an observable.
 * @param route The activated route
 * @param param The parameter name in the route URL
 */
export const routeParamObservable = (
  route: ActivatedRoute,
  param: string,
): Observable<string | undefined> => route.params.pipe(map((params) => params[param]));

/** Extract a route parameter as a signal.
 * @param route The activated route
 * @param param The parameter name in the route URL
 */
export const routeParamSignal = (
  route: ActivatedRoute,
  param: string,
): Signal<string | undefined> => toSignal(routeParamObservable(route, param));

/** Extract a query string parameter as an observable.
 * @param route The activated route
 * @param param The query string parameter name
 */
export const routeQueryStringObservable = (
  route: ActivatedRoute,
  param: string,
): Observable<string | undefined> => route.queryParams.pipe(map((params) => params[param]));

/** Extract a query string parameter as a signal.
 * @param route The activated route
 * @param param The query string parameter name
 */
export const routeQueryStringSignal = (
  route: ActivatedRoute,
  param: string,
): Signal<string | undefined> => toSignal(routeQueryStringObservable(route, param));

/** Create a WritableSignal instance that will also listen to another signal
 * in order to update itself until its own value is no longer nullish.
 *
 * @param source The source signal to listen to
 * @param create A function to create the value of the writable signal
 */
export const lazyInitWritable = <T, K>(
  source: Signal<T>,
  create: (value: NonNullable<T>) => K,
): WritableSignal<K | undefined> => {
  const result = signal<K | undefined>(undefined);

  const ref = effect(
    () => {
      const value = source();
      const current = untracked(result);

      if (!current && value) {
        result.set(create(value));
        ref.destroy(); // Stop listening after initialization
      }
    },
    { allowSignalWrites: true }, // We write to the `result` signal, which is untracked here
  );

  return result;
};

export const assertSignalCast = <T extends { kind: string }, K extends T['kind']>(
  signalMaybeOfKind: Signal<T | undefined>,
  kind: K,
): Signal<T & { kind: K }> => {
  if (signalMaybeOfKind()?.kind === kind) {
    return signalMaybeOfKind as Signal<T & { kind: K }>;
  } else {
    throw new Error(
      `Given object with kind=${signalMaybeOfKind()?.kind} needs to have kind=${kind}`,
    );
  }
};

/** Subscribe to a signal's updates. This function does not rely on `effect()` and can be used outside of injection contexts */
export const subscribeSignal = <T>(_signal: Signal<T>, callback: (value: T) => void) => {
  toObservable(_signal).subscribe(callback);
};

/** Subscribe to a list of signal updates. This function does not rely on `effect()` and can be used outside of injection contexts */
export const subscribeSignals = <T extends Signal<unknown>[]>(
  signals: [...T],
  callback: (...args: [...UnwrappedSignalArrayType<T>]) => void,
): void => {
  const bundle = computed(() => signals.map((s) => s()));
  toObservable(bundle).subscribe((args) => callback(...(args as [...UnwrappedSignalArrayType<T>])));
};

// Helper types for `subscribeSignals` function
/** `Signal<T>` -> `T` */
type UnwrappedSignalType<T> = T extends Signal<infer U> ? U : never;
/** `Signal<T>[]` -> `[T]` */
type UnwrappedSignalArrayType<T extends Signal<unknown>[]> = {
  [K in keyof T]: UnwrappedSignalType<T[K]>;
};

/** Creates a second-counter timer that is synchronized with the local storage in order to resume ticking when reloading the page */
export const localStorageTimer = (
  key: string,
  defaultStartSeconds: number,
  onFinish: () => void,
) => {
  // Use an object to store the interval reference
  const utils = {
    interval: undefined as ReturnType<typeof setInterval> | undefined,
  };

  const initInterval = () =>
    (utils.interval = setInterval(() => {
      const newValue = timer() - 1;
      if (newValue < 0) {
        onFinish();
        remove();
        return;
      }
      timer.set(newValue);
      localStorage.setItem(key, newValue.toString());
    }, 1000));

  const existingSeconds = localStorage.getItem(key);
  if (existingSeconds) {
    defaultStartSeconds = parseInt(existingSeconds, 10);
  } else {
    localStorage.setItem(key, defaultStartSeconds.toString());
  }
  const timer = signal(defaultStartSeconds);

  const reset = (startSeconds: number) => {
    clearInterval(utils.interval);
    utils.interval = initInterval();
    timer.set(startSeconds);
    localStorage.setItem(key, startSeconds.toString());
  };

  const remove = () => {
    clearInterval(utils.interval);
    localStorage.removeItem(key);
  };

  const start = () => {
    clearInterval(utils.interval);
    utils.interval = initInterval();
  };

  return { timer, start, reset, remove } as const;
};

// ********************************************************************************************* //
//                                         FORM BUILDER                                          //
// ********************************************************************************************* //

export const buildTextQuestionForm = (fb: FormBuilder, answer?: TextQuestionAnswer) =>
  fb.group({
    answerText: [answer?.answerText ?? '', Validators.required],
  });

export const buildCheckQuestionForm = (fb: FormBuilder, answer?: CheckQuestionAnswer) =>
  fb.group({
    checkMark: [answer?.checkMark ?? false],
  });

export const buildRatingQuestionForm = (fb: FormBuilder, answer?: RatingQuestionAnswer) =>
  fb.group({
    choice: [answer?.choice, Validators.required],
    confidence: [
      answer?.confidence ?? 0,
      [Validators.required, Validators.min(0), Validators.max(1)],
    ],
  });

export const buildScaleQuestionForm = (fb: FormBuilder, answer?: ScaleQuestionAnswer) =>
  fb.group({
    score: [answer?.score ?? 0, [Validators.required, Validators.min(0), Validators.max(10)]],
  });

export const buildQuestionForm = (
  fb: FormBuilder,
  config: QuestionConfig,
  answer?: QuestionAnswer,
) => {
  switch (config.kind) {
    case SurveyQuestionKind.Text:
      return buildTextQuestionForm(fb, assertCastOrUndefined(answer, SurveyQuestionKind.Text));
    case SurveyQuestionKind.Check:
      return buildCheckQuestionForm(fb, assertCastOrUndefined(answer, SurveyQuestionKind.Check));
    case SurveyQuestionKind.Rating:
      return buildRatingQuestionForm(fb, assertCastOrUndefined(answer, SurveyQuestionKind.Rating));
    case SurveyQuestionKind.Scale:
      return buildScaleQuestionForm(fb, assertCastOrUndefined(answer, SurveyQuestionKind.Scale));
  }
};

// ********************************************************************************************* //
//                                           VALIDATORS                                          //
// ********************************************************************************************* //

/** Validator that interprets a value as forbidden (useful for string enum forms with a default) */
export function forbiddenValueValidator(forbiddenValue: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === forbiddenValue) {
      // Return an error if the value is the forbidden value
      return { forbiddenValue: { value: control.value } };
    }
    return null; // Return null if there is no error
  };
}
