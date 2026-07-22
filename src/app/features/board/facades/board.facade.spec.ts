import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { BoardRealtimeService } from '../data-access/board-realtime.service';
import { BoardColumnViewModel, BoardState } from '../models/board-column.model';
import { BoardFacade } from './board.facade';

describe('BoardFacade', () => {
  const initialState: BoardState = {
    version: 2,
    columns: [
      { id: 'column-1', title: 'Desenvolvimento', type: 'doing-and-done' },
      { id: 'column-2', title: 'Produção', type: 'done-only' },
    ],
    tasks: [
      { id: 'task-1', title: 'Primeira', columnId: 'column-1', status: 'doing', position: 1, checklist: [] },
      { id: 'task-2', title: 'Segunda', columnId: 'column-1', status: 'doing', position: 0, checklist: [] },
    ],
  };

  const stateSubject = new BehaviorSubject(initialState);
  const realtime = {
    state$: stateSubject.asObservable(),
    connect: vi.fn().mockResolvedValue(undefined),
    addColumn: vi.fn().mockResolvedValue(undefined),
    addTask: vi.fn().mockResolvedValue(undefined),
    moveTask: vi.fn().mockResolvedValue(undefined),
    toggleChecklist: vi.fn().mockResolvedValue(undefined),
  };

  let facade: BoardFacade;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [{ provide: BoardRealtimeService, useValue: realtime }],
    });
    facade = TestBed.inject(BoardFacade);
  });

  it('groups and orders tasks received from the server', () => {
    let board: readonly BoardColumnViewModel[] = [];
    facade.board$.subscribe((value) => (board = value));

    expect(board[0]?.doingTasks.map(({ id }) => id)).toEqual(['task-2', 'task-1']);
    expect(board[1]?.doingTasks).toEqual([]);
  });

  it('sends commands through the realtime service', () => {
    const column = { title: 'Review', type: 'doing-and-done' as const };

    facade.addColumn(column);

    expect(realtime.addColumn).toHaveBeenCalledWith(column);
  });
});
