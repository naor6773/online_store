import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemDescriptionComponent } from './item-description.component';

describe('ItemDescriptionComponent', () => {
  let component: ItemDescriptionComponent;
  let fixture: ComponentFixture<ItemDescriptionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ItemDescriptionComponent]
    });
    fixture = TestBed.createComponent(ItemDescriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
