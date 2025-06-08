import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CartUnitComponent } from './cart-unit.component';

describe('CartUnitComponent', () => {
  let component: CartUnitComponent;
  let fixture: ComponentFixture<CartUnitComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CartUnitComponent]
    });
    fixture = TestBed.createComponent(CartUnitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
