import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { STFUsefulComponent } from './useful.component';

@NgModule({
  declarations: [STFUsefulComponent],
  imports: [CommonModule, MatButtonModule, MatIconModule, TranslateModule.forChild()],
  exports: [STFUsefulComponent],
})
export class STFUsefulModule {}
