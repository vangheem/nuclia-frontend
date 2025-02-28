import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchComponent } from './search.component';
import { MockProvider } from 'ng-mocks';
import { BackendConfigurationService, SDKService, STFTrackingService } from '@flaps/core';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { Nuclia, WritableKnowledgeBox } from '@nuclia/core';
import { ResourceViewerService } from '../../../../../libs/common/src/lib/resources/resource-viewer.service';

describe('SearchComponent', () => {
  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SearchComponent],
      providers: [
        MockProvider(SDKService, {
          currentKb: of({
            id: 'testKb',
            getLabels: jest.fn(() => of({})),
            training: {
              hasModel: jest.fn(() => of(true)),
            },
          } as any as WritableKnowledgeBox),
          nuclia: {
            options: {
              zone: 'europe',
            },
          } as any as Nuclia,
        }),
        MockProvider(BackendConfigurationService),
        MockProvider(TranslateService),
        MockProvider(ResourceViewerService),
        {
          provide: STFTrackingService,
          useValue: {
            isFeatureEnabled: () => of(true),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should generate and display a search widget', () => {
    expect(component).toBeTruthy();
    const searchPage = fixture.debugElement.nativeElement.querySelector('.search-page');
    expect(searchPage.innerHTML).toContain('nuclia-search-bar');
  });
});
