import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { BillingService } from '../billing.service';
import { CalculatorComponent } from '../calculator/calculator.component';
import { forkJoin, shareReplay, take, tap } from 'rxjs';
import { SisModalService } from '@nuclia/sistema';
import { STFTrackingService } from '@flaps/core';
import { COUNTRIES } from '../utils';
import { Currency } from '../billing.models';
import { FeaturesComponent } from '../features/features.component';

@Component({
  selector: 'app-subscriptions',
  templateUrl: './subscriptions.component.html',
  styleUrls: ['./subscriptions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionsComponent {
  isCalculatorEnabled = this.tracking.isFeatureEnabled('calculator').pipe(shareReplay());
  accountType = this.billing.type.pipe(shareReplay());
  countryList = Object.entries(COUNTRIES)
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
  currency?: Currency;
  prices = this.billing.getPrices().pipe(shareReplay());

  constructor(
    private billing: BillingService,
    private modalService: SisModalService,
    private tracking: STFTrackingService,
    private cdr: ChangeDetectorRef,
  ) {
    forkJoin([this.billing.getCustomer(), this.billing.country.pipe(take(1))]).subscribe(([customer, country]) => {
      if (customer) {
        this.onSelectCountry(customer.billing_details.country);
      } else if (country) {
        this.onSelectCountry(country);
      }
    });
  }

  openCalculator() {
    this.prices.pipe(take(1)).subscribe((prices) => {
      this.modalService.openModal(CalculatorComponent, {
        dismissable: true,
        data: {
          prices: prices['stash-developer'],
          currency: this.currency,
        },
      });
    });
  }

  openFeatures() {
    this.modalService.openModal(FeaturesComponent);
  }

  onSelectCountry(country: string) {
    this.billing.setCountry(country);
    this.billing
      .getCurrency(country)
      .pipe(tap((currency) => (this.currency = currency)))
      .subscribe(() => this.cdr.markForCheck());
  }
}
