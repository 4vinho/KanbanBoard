import { TestBed } from '@angular/core/testing';
import { BoardStorageService } from './board-storage.service';

describe('BoardStorageService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => localStorage.clear());

  it('should restore saved columns', () => {
    const service = TestBed.inject(BoardStorageService);
    const columns = [{ id: 'column-1', title: 'Desenvolvimento', type: 'doing-and-done' }] as const;

    service.saveColumns(columns);

    expect(service.loadColumns()).toEqual(columns);
  });

  it('should return an empty board when stored data is corrupted', () => {
    localStorage.setItem('kanban-board:columns:v1', 'invalid-json');

    expect(TestBed.inject(BoardStorageService).loadColumns()).toEqual([]);
  });
});
