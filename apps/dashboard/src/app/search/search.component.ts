import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { BackendConfigurationService, SDKService, STFTrackingService } from '@flaps/core';
import { distinctUntilKeyChanged, forkJoin, map, switchMap, tap } from 'rxjs';
import { DEFAULT_FEATURES_LIST } from '../widgets/widget-features';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { TrainingType } from '@nuclia/core';
import { ResourceViewerService } from '@flaps/common';

const searchWidgetId = 'search-bar';
const searchResultsId = 'search-results';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchComponent implements OnDestroy, OnInit {
  searchWidget = this.sdk.currentKb.pipe(
    distinctUntilKeyChanged('id'),
    tap(() => {
      document.getElementById(searchWidgetId)?.remove();
    }),
    switchMap((kb) =>
      forkJoin([
        kb.getLabels().pipe(map((labelSets) => Object.keys(labelSets).length > 0)),
        kb.training.hasModel(TrainingType.classifier),
        this.tracking.isFeatureEnabled('answers'),
      ]).pipe(map(([hasLabels, hasClassifier, isChatEnabled]) => ({ kb, hasLabels, hasClassifier, isChatEnabled }))),
    ),
    map(({ kb, hasLabels, hasClassifier, isChatEnabled }) => {
      let features = !hasLabels
        ? DEFAULT_FEATURES_LIST.split(',')
            .filter((feature) => feature !== 'filter')
            .join(',')
        : DEFAULT_FEATURES_LIST;
      if (hasClassifier) {
        features += ',suggestLabels';
      }
      // TEMPORARILY DISABLE CHAT IN DASHBOARD SEARCH
      // if (isChatEnabled) {
      //   features += ',answers';
      // }
      return this.sanitized.bypassSecurityTrustHtml(`<nuclia-search-bar id="${searchWidgetId}"
  knowledgebox="${kb.id}"
  zone="${this.sdk.nuclia.options.zone}"
  client="dashboard"
  cdn="${this.backendConfig.getCDN() ? this.backendConfig.getCDN() + '/' : ''}"
  backend="${this.backendConfig.getAPIURL()}"
  state="${kb.state || ''}"
  kbslug="${kb.slug || ''}"
  account="${kb.account || ''}"
  lang="${this.translation.currentLang}"
  features="${features}"
></nuclia-search-bar>`);
    }),
  );
  searchResults = this.sanitized.bypassSecurityTrustHtml(
    `<nuclia-search-results id="${searchResultsId}"></nuclia-search-results>`,
  );

  constructor(
    private sdk: SDKService,
    private sanitized: DomSanitizer,
    private backendConfig: BackendConfigurationService,
    private translation: TranslateService,
    private viewerService: ResourceViewerService,
    private tracking: STFTrackingService,
  ) {}

  ngOnInit() {
    this.viewerService.init(searchResultsId);
  }

  ngOnDestroy() {
    const searchBarElement = document.querySelector('nuclia-search-bar') as any;
    const searchResultsElement = document.querySelector('nuclia-search-results') as any;
    if (typeof searchBarElement?.$destroy === 'function') {
      searchBarElement.$destroy();
    }
    if (typeof searchResultsElement?.$destroy === 'function') {
      searchResultsElement.$destroy();
    }
  }
}
