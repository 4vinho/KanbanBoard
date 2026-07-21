import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BoardGuideType } from '../../models/board-column.model';

@Component({
  selector: 'app-board-guide',
  templateUrl: './board-guide.html',
  styleUrl: './board-guide.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardGuide {
  readonly title = input.required<string>();
  readonly type = input.required<BoardGuideType>();
}
