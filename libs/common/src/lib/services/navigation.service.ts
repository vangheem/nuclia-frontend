import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, StateService, StaticEnvironmentConfiguration } from '@flaps/core';
import { combineLatest, map, Observable } from 'rxjs';
import { standaloneSimpleAccount } from '../select-account-kb/utils';

const IN_ACCOUNT_MANAGEMENT = new RegExp('/at/[^/]+/manage');

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  constructor(
    private stateService: StateService,
    private router: Router,
    private authService: AuthService,
    @Inject('staticEnvironmentConfiguration') private environment: StaticEnvironmentConfiguration,
  ) {}

  homeUrl: Observable<string> = combineLatest([this.stateService.account, this.stateService.stash]).pipe(
    map(([account, kb]) => {
      if (account && this.inAccountManagement(location.pathname)) {
        return this.getAccountManageUrl(account.slug);
      } else if (account && kb) {
        return this.getKbUrl(account.slug, kb.slug!);
      } else if (account) {
        return this.getKbSelectUrl(account.slug);
      } else {
        return '/';
      }
    }),
  );

  inAccountManagement(path: string): boolean {
    return path.match(IN_ACCOUNT_MANAGEMENT) !== null;
  }

  getAccountUrl(accountSlug: string): string {
    return `/at/${accountSlug}`;
  }

  getKbUrl(accountSlug: string, kbSlug: string): string {
    return `/at/${accountSlug}/${kbSlug}`;
  }

  getAccountSelectUrl() {
    return `/select`;
  }

  getKbSelectUrl(accountSlug: string) {
    return `/select/${accountSlug}`;
  }

  getAccountManageUrl(accountSlug: string): string {
    return `${this.getAccountUrl(accountSlug)}/manage`;
  }

  getKbManageUrl(accountSlug: string, kbSlug: string): string {
    return `${this.getKbUrl(accountSlug, kbSlug)}/manage`;
  }

  getKbUsersUrl(accountSlug: string, kbSlug: string): string {
    return `${this.getKbUrl(accountSlug, kbSlug)}/users`;
  }

  getSearchUrl(accountSlug: string, kbSlug: string): string {
    return `${this.getKbUrl(accountSlug, kbSlug)}/search`;
  }
  // Redirect authenticated users to the landing page.
  goToLandingPage(): void {
    const data = this.stateService.dbGetStateData();
    const goToUrl = this.authService.getNextUrl();
    if (goToUrl && goToUrl !== '/') {
      this.goToNextUrl(goToUrl);
    } else if ((!!data && data.account) || this.environment.standalone) {
      const account = !!data && data.account ? data.account : standaloneSimpleAccount.slug;
      this.router.navigate([this.getKbSelectUrl(account)]);
    } else {
      this.router.navigate([this.getAccountSelectUrl()]);
    }
  }

  private goToNextUrl(goToUrl: string) {
    let goToParams = null;
    if (this.authService.getNextParams() !== null) {
      goToParams = JSON.parse(this.authService.getNextParams() as string);
    }
    this.authService.setNextParams(null);
    this.authService.setNextUrl(null);
    this.router.navigate([goToUrl], { queryParams: goToParams });
  }

  resetState() {
    this.stateService.dbDelStateData();
    this.stateService.cleanAccount();
    this.router.navigate([this.getAccountSelectUrl()]);
  }
}
