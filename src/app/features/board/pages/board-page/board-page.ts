import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MainContainer } from '../../../../core/components/main-container/main-container';
import { BoardGuide } from '../../components/board-guide/board-guide';

@Component({
  selector: 'app-board-page',
  imports: [BoardGuide, MainContainer],
  templateUrl: './board-page.html',
  styleUrl: './board-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardPage {}
