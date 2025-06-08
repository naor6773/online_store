import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeStatsBuyComponent } from './me-stats-buy.component';

describe('MeStatsBuyComponent', () => {
  let component: MeStatsBuyComponent;
  let fixture: ComponentFixture<MeStatsBuyComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MeStatsBuyComponent]
    });
    fixture = TestBed.createComponent(MeStatsBuyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
