import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DataCollectionComponent } from './data-collection/data-collection.component';

const routes: Routes = [
  { path: '', redirectTo: '/data-collection', pathMatch: 'full' },
  { path: 'data-collection', component: DataCollectionComponent },
  // Add more routes as needed
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
