import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FlexLayoutModule } from '@angular/flex-layout';
import { PaIconModule } from '@guillotinaweb/pastanaga-angular';

import { NavbarComponent } from './navbar.component';
import { SmallNavbarDirective } from './small-navbar.directive';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    AngularSvgIconModule,
    FlexLayoutModule,
    TranslateModule.forChild(),
    PaIconModule,
  ],
  declarations: [NavbarComponent, SmallNavbarDirective],
  exports: [NavbarComponent, SmallNavbarDirective],
})
export class NavbarModule {}
