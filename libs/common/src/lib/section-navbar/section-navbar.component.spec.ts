import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OverlayModule } from '@angular/cdk/overlay';
import { TranslatePipeMock } from '@flaps/core';

import { SectionNavbarComponent } from './section-navbar.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('SectionNavComponent', () => {
  let component: SectionNavbarComponent;
  let fixture: ComponentFixture<SectionNavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SectionNavbarComponent, TranslatePipeMock],
      imports: [OverlayModule, RouterTestingModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SectionNavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    fixture.destroy();
  });
});
