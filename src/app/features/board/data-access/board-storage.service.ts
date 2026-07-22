import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BoardState, EMPTY_BOARD_STATE } from '../models/board-column.model';

export const BOARD_STORAGE_KEY = 'kanban-board:v2';
const LEGACY_STORAGE_KEY = 'kanban-board:columns:v1';

@Injectable({ providedIn: 'root' })
export class BoardStorageService {
  private readonly platformId = inject(PLATFORM_ID);

  loadBoard(): BoardState {
    if (!isPlatformBrowser(this.platformId)) {
      return EMPTY_BOARD_STATE;
    }

    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      const serializedBoard = localStorage.getItem(BOARD_STORAGE_KEY);

      if (!serializedBoard) {
        return EMPTY_BOARD_STATE;
      }

      const storedBoard: unknown = JSON.parse(serializedBoard);
      return this.isStoredBoard(storedBoard) ? storedBoard : EMPTY_BOARD_STATE;
    } catch {
      return EMPTY_BOARD_STATE;
    }
  }

  saveBoard(board: BoardState): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(board));
    } catch {
      // O quadro continua utilizável quando o armazenamento está indisponível ou cheio.
    }
  }

  private isStoredBoard(value: unknown): value is BoardState {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const board = value as Partial<BoardState>;
    return (
      board.version === 2 &&
      Array.isArray(board.columns) &&
      board.columns.every((column: unknown) => {
        if (!column || typeof column !== 'object') return false;
        const candidate = column as Record<string, unknown>;
        return (
          typeof candidate['id'] === 'string' &&
          typeof candidate['title'] === 'string' &&
          (candidate['type'] === 'doing-and-done' || candidate['type'] === 'done-only')
        );
      }) &&
      Array.isArray(board.tasks) &&
      board.tasks.every((task: unknown) => {
        if (!task || typeof task !== 'object') return false;
        const candidate = task as Record<string, unknown>;
        return (
          typeof candidate['id'] === 'string' &&
          typeof candidate['title'] === 'string' &&
          typeof candidate['columnId'] === 'string' &&
          (candidate['status'] === 'doing' || candidate['status'] === 'done') &&
          typeof candidate['position'] === 'number' &&
          Array.isArray(candidate['checklist']) &&
          candidate['checklist'].every((item: unknown) => {
            if (!item || typeof item !== 'object') return false;
            const checklistItem = item as Record<string, unknown>;
            return (
              typeof checklistItem['id'] === 'string' &&
              typeof checklistItem['description'] === 'string' &&
              typeof checklistItem['completed'] === 'boolean'
            );
          })
        );
      })
    );
  }
}
