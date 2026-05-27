import { TestBed } from '@angular/core/testing';

import { ActivityLogs } from './activity-logs';

describe('ActivityLogs', () => {
  let service: ActivityLogs;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActivityLogs);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
