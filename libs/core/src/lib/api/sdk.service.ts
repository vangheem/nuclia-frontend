import { Injectable } from '@angular/core';
import {
  Account,
  Counters,
  IKnowledgeBoxItem,
  KnowledgeBox,
  LearningConfiguration,
  LearningConfigurationSet,
  Nuclia,
  WritableKnowledgeBox,
} from '@nuclia/core';
import {
  BehaviorSubject,
  combineLatest,
  delay,
  distinctUntilChanged,
  filter,
  forkJoin,
  map,
  Observable,
  of,
  ReplaySubject,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { BackendConfigurationService } from '../config';
import { StateService } from '../state.service';
import { FeatureFlagService } from '../analytics/feature-flag.service';
import { take } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SDKService {
  DEMO_SLUG = '__demo';
  nuclia: Nuclia = new Nuclia({
    backend: this.config.getAPIURL(),
    client: this.config.staticConf.client,
    standalone: this.config.staticConf.standalone,
  });

  private _currentKB = new ReplaySubject<WritableKnowledgeBox>(1);
  private _kbList = new ReplaySubject<IKnowledgeBoxItem[]>(1);
  private _refreshCounter = new Subject<boolean>();
  private _repetitiveRefreshCounter = new Subject<void>();
  private _isKbLoaded = false;

  currentKb = this._currentKB.asObservable();
  kbList: Observable<IKnowledgeBoxItem[]> = this._kbList.asObservable();
  currentAccount: Observable<Account> = this.stateService.account.pipe(
    filter((account) => !!account),
    map((account) => account as Account),
  );
  counters = new ReplaySubject<Counters>(1);
  pendingRefresh = new BehaviorSubject(false);
  refreshing = this._refreshCounter.asObservable();

  get isKbLoaded() {
    return this._isKbLoaded;
  }

  constructor(
    private config: BackendConfigurationService,
    private stateService: StateService,
    private featureFlagService: FeatureFlagService,
  ) {
    combineLatest([this.stateService.stash, this.stateService.account])
      .pipe(
        filter(([kb, account]) => !!kb && !!kb.slug && !!account && !!account.slug),
        map(([kb, account]) => [kb, account] as [KnowledgeBox, Account]),
        distinctUntilChanged((previous, current) => previous[0].id === current[0].id),
        switchMap(([kb, account]) =>
          kb && kb.slug === this.DEMO_SLUG
            ? this.getDemoKb()
            : this.nuclia.db
                .getKnowledgeBox(account.slug, (this.config.staticConf.standalone ? kb.id : kb.slug) as string)
                .pipe(map((data) => new WritableKnowledgeBox(this.nuclia, account.slug, data))),
        ),
        tap(() => (this._isKbLoaded = true)),
      )
      .subscribe((kb) => this._currentKB.next(kb));

    this.countersRefreshSubcriptions();
    this.refreshCounter(true);
    this.refreshKbList();
  }

  setCurrentAccount(accountSlug: string): Observable<Account> {
    // returns the current account and set it if not set
    const currentAccount = this.config.staticConf.standalone ? { slug: accountSlug } : this.stateService.getAccount();
    const accountObs =
      currentAccount && currentAccount.slug === accountSlug
        ? of(currentAccount as Account)
        : this.nuclia.db.getAccount(accountSlug);
    return accountObs.pipe(tap((account) => this.stateService.setAccount(account)));
  }

  setCurrentKnowledgeBox(accountSlug: string, kbSlug: string, force = false): Observable<WritableKnowledgeBox> {
    // returns the current kb and set it if not set
    const currentKb = this.stateService.getStash();
    if (currentKb && currentKb.slug === kbSlug && !force) {
      return of(currentKb as WritableKnowledgeBox);
    } else if (kbSlug === this.DEMO_SLUG) {
      return this.getDemoKb().pipe(
        tap((kb) => {
          this.nuclia.options.zone = 'europe-1';
          this.stateService.setStash(kb);
        }),
      );
    } else {
      return this.nuclia.db.getKnowledgeBox(accountSlug, kbSlug).pipe(
        map((kb) => {
          this.stateService.setStash(kb);
          return kb;
        }),
      );
    }
  }

  getDemoKb(): Observable<WritableKnowledgeBox> {
    return this.featureFlagService.getFeatureFlag('demo-kb-id').pipe(
      map(
        (kbId) =>
          new WritableKnowledgeBox(this.nuclia, this.stateService.getAccount()?.slug || '', {
            id: kbId as string,
            zone: 'europe-1',
            slug: this.DEMO_SLUG,
            title: 'Demo',
          }),
      ),
    );
  }

  refreshCounter(singleTry = false): void {
    this._refreshCounter.next(true);
    if (!singleTry) {
      this._repetitiveRefreshCounter.next();
    }
  }

  refreshKbList(refreshCurrentKb = false) {
    const kbList = this.nuclia.options.standalone
      ? this.nuclia.db
          .getStandaloneKbs()
          .pipe(
            map((kbs) => kbs.map((kb) => ({ ...kb, id: kb.uuid, title: kb.slug, zone: 'local' } as IKnowledgeBoxItem))),
          )
      : this.stateService.account.pipe(
          filter((account) => !!account),
          map((account) => account as Account),
          take(1),
          switchMap((account) => this.nuclia.db.getKnowledgeBoxes(account.slug)),
        );

    kbList.subscribe((list) => this._kbList.next(list));

    if (refreshCurrentKb) {
      forkJoin([this.currentAccount.pipe(take(1)), this.currentKb.pipe(take(1))])
        .pipe(
          switchMap(([account, kb]) =>
            this.nuclia.db
              .getKnowledgeBox(
                account.slug || account.id,
                (this.config.staticConf.standalone ? kb.id : kb.slug) as string,
              )
              .pipe(map((data) => new WritableKnowledgeBox(this.nuclia, account.slug || account.id, data))),
          ),
        )
        .subscribe((kb) => this._currentKB.next(kb));
    }
  }

  private countersRefreshSubcriptions() {
    this._refreshCounter
      .pipe(
        filter((refresh) => refresh),
        switchMap(() => this.currentKb),
        switchMap((kb) => kb.counters()),
        tap((counters) => this.counters.next(counters)),
      )
      .subscribe();

    this._repetitiveRefreshCounter
      .pipe(
        switchMap(() => {
          this.pendingRefresh.next(true);
          let currentTotal = -1;
          let retries = 0;
          return this.counters.pipe(
            delay(5000),
            tap((counters) => {
              if (currentTotal === -1) {
                currentTotal = counters.resources;
              }
              const keepPulling = retries < 15 && currentTotal === counters.resources;
              this._refreshCounter.next(keepPulling);
              if (!keepPulling) {
                this.pendingRefresh.next(false);
              }
              retries += 1;
            }),
            takeUntil(this._refreshCounter.pipe(filter((refresh) => !refresh))),
          );
        }),
      )
      .subscribe();
  }

  getVisibleLearningConfiguration(
    onCreation = true,
  ): Observable<{ display: LearningConfigurationSet; full: LearningConfigurationSet }> {
    return forkJoin([
      this.featureFlagService.isFeatureEnabled('kb-anonymization').pipe(take(1)),
      this.featureFlagService.isFeatureEnabled('answers').pipe(take(1)),
      this.nuclia.db.getLearningConfigurations().pipe(take(1)),
    ]).pipe(
      map(([hasAnonymization, hasAnswers, conf]) => {
        const full = Object.entries(conf)
          .map(([id, data]) => ({ id, data }))
          // semantic_model cannot be changed after kb creation
          .filter((entry) => onCreation || entry.id !== 'semantic_model');

        return {
          // At display, hide configurations with only one option or under feature flagging
          display: full.filter(
            (entry) =>
              entry.data.options.length > 1 &&
              (entry.id !== 'anonymization_model' || hasAnonymization) &&
              (entry.id !== 'generative_model' || hasAnswers),
          ),
          full,
        };
      }),
    );
  }
}
