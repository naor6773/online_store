import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PriceDropRecommendationsComponent } from './price-drop-recommendations.component';

describe('PriceDropRecommendationsComponent', () => {
  let component: PriceDropRecommendationsComponent;
  let fixture: ComponentFixture<PriceDropRecommendationsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PriceDropRecommendationsComponent]
    });
    fixture = TestBed.createComponent(PriceDropRecommendationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
