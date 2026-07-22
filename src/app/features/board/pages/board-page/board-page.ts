import { CdkDropListGroup } from '@angular/cdk/drag-drop';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardDialogService } from '@/shared/components/dialog';
import { MainContainer } from '../../../../core/components/main-container/main-container';
import { AddColumnDialog } from '../../components/add-column-dialog/add-column-dialog';
import { AddTaskDialog } from '../../components/add-task-dialog/add-task-dialog';
import { BoardGuide } from '../../components/board-guide/board-guide';
import { BoardFacade } from '../../facades/board.facade';
import { MoveBoardTask, TaskStatus, ToggleChecklistItem } from '../../models/board-column.model';

@Component({
  selector: 'app-board-page',
  imports: [AsyncPipe, BoardGuide, CdkDropListGroup, MainContainer, ZardButtonComponent],
  templateUrl: './board-page.html',
  styleUrl: './board-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardPage {
  private readonly dialogService = inject(ZardDialogService);
  protected readonly boardFacade = inject(BoardFacade);
  protected readonly board$ = this.boardFacade.board$;

  protected openAddColumnDialog(): void {
    this.dialogService.create<AddColumnDialog>({
      zTitle: 'Nova coluna',
      zDescription: 'Defina como o trabalho será acompanhado nesta coluna.',
      zContent: AddColumnDialog,
      zOkText: 'Adicionar coluna',
      zCancelText: 'Cancelar',
      zOnOk: (dialog) => {
        const column = dialog.getColumn();
        if (!column) return false;
        this.boardFacade.addColumn(column);
        return undefined;
      },
      zWidth: '32rem',
    });
  }

  protected openAddTaskDialog(columnId: string, status: TaskStatus): void {
    this.dialogService.create<AddTaskDialog>({
      zTitle: 'Nova tarefa',
      zDescription: 'Crie uma tarefa e adicione os itens necessários ao checklist.',
      zContent: AddTaskDialog,
      zOkText: 'Adicionar tarefa',
      zCancelText: 'Cancelar',
      zOnOk: (dialog) => {
        const task = dialog.getTask();
        if (!task) return false;
        this.boardFacade.addTask({ ...task, columnId, status });
        return undefined;
      },
      zWidth: '36rem',
    });
  }

  protected moveTask(move: MoveBoardTask): void {
    this.boardFacade.moveTask(move);
  }

  protected toggleChecklist(toggle: ToggleChecklistItem): void {
    this.boardFacade.toggleChecklistItem(toggle);
  }
}
