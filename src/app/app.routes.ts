import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/board/pages/board-page/board-page').then(({ BoardPage }) => BoardPage),
    title: 'KanbanBoard',
  },
  { path: '**', redirectTo: '' },
];
