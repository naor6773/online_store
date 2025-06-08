import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WishListUnitComponent } from './wish-list-unit.component';

describe('WishListUnitComponent', () => {
  let component: WishListUnitComponent;
  let fixture: ComponentFixture<WishListUnitComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WishListUnitComponent]
    });
    fixture = TestBed.createComponent(WishListUnitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
