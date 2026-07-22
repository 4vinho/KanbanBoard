import { TestBed } from '@angular/core/testing';
import { BoardState, EMPTY_BOARD_STATE } from '../models/board-column.model';
import { BOARD_STORAGE_KEY, BoardStorageService } from './board-storage.service';

describe('BoardStorageService', () => {
  const board: BoardState = {
    version: 2,
    columns: [{ id: 'column-1', title: 'Desenvolvimento', type: 'doing-and-done' }],
    tasks: [
      {
        id: 'task-1',
        title: 'Criar drag and drop',
        columnId: 'column-1',
        status: 'doing',
        position: 0,
        checklist: [{ id: 'item-1', description: 'Adicionar CDK', completed: true }],
      },
    ],
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => localStorage.clear());

  it('should restore a saved board', () => {
    const service = TestBed.inject(BoardStorageService);

    service.saveBoard(board);

    expect(service.loadBoard()).toEqual(board);
  });

  it('should return an empty board when stored data is corrupted', () => {
    localStorage.setItem(BOARD_STORAGE_KEY, 'invalid-json');

    expect(TestBed.inject(BoardStorageService).loadBoard()).toEqual(EMPTY_BOARD_STATE);
  });

  it('should discard the legacy storage', () => {
    localStorage.setItem('kanban-board:columns:v1', JSON.stringify({ version: 1, columns: [] }));

    expect(TestBed.inject(BoardStorageService).loadBoard()).toEqual(EMPTY_BOARD_STATE);
    expect(localStorage.getItem('kanban-board:columns:v1')).toBeNull();
  });
});
