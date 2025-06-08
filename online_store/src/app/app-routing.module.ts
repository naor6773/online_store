import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ItemDescriptionComponent } from './components/item-description/item-description.component';
import { ItemsComponent } from './components/items/items.component';
import { CartComponent } from './components/cart/cart.component';
import { LogInComponent } from './components/log-in/log-in.component';
import { MeComponent } from './components/me/me.component';
import { AuthGuard } from './AuthGuard';
import { AddItemComponent } from './components/add-item/add-item.component';
import { WishListComponent } from './components/wish-list/wish-list.component';

const routes: Routes = [
  { path: 'me', component: MeComponent, canActivate: [AuthGuard] },
  { path: 'home', component: ItemsComponent, canActivate: [AuthGuard] },
  { path: 'cart', component: CartComponent, canActivate: [AuthGuard] },
  { path: 'wishlist', component: WishListComponent, canActivate: [AuthGuard] },
  { path: 'item-description', component: ItemDescriptionComponent, canActivate: [AuthGuard] },
  { path: 'add-item', component: AddItemComponent },
  { path: '', component: LogInComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
