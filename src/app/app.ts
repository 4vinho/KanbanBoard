import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BoardGuide } from './components/board-guide/board-guide';

@Component({
  selector: 'app-root',
  imports: [BoardGuide],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
}
