import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardDialogService } from '@/shared/components/dialog';
import { MainContainer } from '../../../../core/components/main-container/main-container';
import { AddColumnDialog } from '../../components/add-column-dialog/add-column-dialog';
import { BoardGuide } from '../../components/board-guide/board-guide';
import { BoardFacade } from '../../facades/board.facade';

@Component({
  selector: 'app-board-page',
  imports: [BoardGuide, MainContainer, ZardButtonComponent],
  templateUrl: './board-page.html',
  styleUrl: './board-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardPage {
  private readonly dialogService = inject(ZardDialogService);
  protected readonly boardFacade = inject(BoardFacade);

  protected readonly columns = this.boardFacade.columns;

  protected openAddColumnDialog(): void {
    this.dialogService.create<AddColumnDialog>({
      zTitle: 'Nova coluna',
      zDescription: 'Defina como o trabalho será acompanhado nesta coluna.',
      zContent: AddColumnDialog,
      zOkText: 'Adicionar coluna',
      zCancelText: 'Cancelar',
      zOnOk: (dialog) => this.addColumn(dialog),
      zWidth: '32rem',
    });
  }

  private addColumn(dialog: AddColumnDialog): false | void {
    const column = dialog.getColumn();

    if (!column) {
      return false;
    }

    this.boardFacade.addColumn(column);
  }
}
