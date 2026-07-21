import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardDialogService } from '@/shared/components/dialog';

@Component({
  selector: 'app-header',
  imports: [ZardButtonComponent],
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  private readonly dialogService = inject(ZardDialogService);

  protected openNewGuideDialog(): void {
    this.dialogService.create({
      zTitle: 'Nova guia',
      zDescription: 'A configuração da guia será adicionada no próximo passo.',
      zContent: 'Você poderá escolher o título e o tipo da nova guia.',
      zOkText: 'Continuar',
      zCancelText: 'Cancelar',
    });
  }
}
