import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeRecentBuyComponent } from './me-recent-buy.component';

describe('MeRecentBuyComponent', () => {
  let component: MeRecentBuyComponent;
  let fixture: ComponentFixture<MeRecentBuyComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MeRecentBuyComponent]
    });
    fixture = TestBed.createComponent(MeRecentBuyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
