import { TestBed } from '@angular/core/testing';
import { BoardStorageService } from '../data-access/board-storage.service';
import { BoardFacade } from './board.facade';

describe('BoardFacade', () => {
  const storedColumn = {
    id: 'column-1',
    title: 'Descoberta',
    type: 'done-only',
  } as const;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: BoardStorageService,
          useValue: {
            loadColumns: () => [storedColumn],
            saveColumns: vi.fn(),
          },
        },
      ],
    });
  });

  it('should expose stored columns', () => {
    expect(TestBed.inject(BoardFacade).columns()).toEqual([storedColumn]);
  });

  it('should add a column to the state', () => {
    const facade = TestBed.inject(BoardFacade);

    facade.addColumn({ title: 'Desenvolvimento', type: 'doing-and-done' });

    expect(facade.columns()).toEqual([
      storedColumn,
      expect.objectContaining({ title: 'Desenvolvimento', type: 'doing-and-done' }),
    ]);
  });
});
