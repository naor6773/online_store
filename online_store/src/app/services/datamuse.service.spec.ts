import { TestBed } from '@angular/core/testing';

import { DatamuseService } from './datamuse.service';

describe('DatamuseService', () => {
  let service: DatamuseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DatamuseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
