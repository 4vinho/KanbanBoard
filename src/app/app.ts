import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BoardGuide } from './components/board-guide/board-guide';
import { Footer } from './core/components/footer/footer';
import { Header } from './core/components/header/header';
import { MainContainer } from './core/components/main-container/main-container';

@Component({
  selector: 'app-root',
  imports: [BoardGuide, Footer, Header, MainContainer],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
}
