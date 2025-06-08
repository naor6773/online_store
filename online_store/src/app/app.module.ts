import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { ChartistModule } from 'ng-chartist';
import { RecaptchaV3Module, RECAPTCHA_V3_SITE_KEY } from 'ng-recaptcha';
import { MatSliderModule } from '@angular/material/slider';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { NgChartsModule } from 'ng2-charts';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

import { AppComponent } from './app.component';
import { ItemsComponent } from './components/items/items.component';
import { ItemUnitComponent } from './components/item-unit/item-unit.component';
import { ItemDescriptionComponent } from './components/item-description/item-description.component';
import { CartComponent } from './components/cart/cart.component';
import { CartUnitComponent } from './components/cart-unit/cart-unit.component';
import { LogInComponent } from './components/log-in/log-in.component';
import { MeComponent } from './components/me/me.component';
import { MeRecentBuyComponent } from './components/me-recent-buy/me-recent-buy.component';
import { AddItemComponent } from './components/add-item/add-item.component';
import { MeStatsBuyComponent } from './components/me-stats-buy/me-stats-buy.component';
import { WishListComponent } from './components/wish-list/wish-list.component';
import { WishListUnitComponent } from './components/wish-list-unit/wish-list-unit.component';
import { PriceDropRecommendationsComponent } from './components/price-drop-recommendations/price-drop-recommendations.component';
import { PopularTagsComponent } from './components/popular-tags/popular-tags.component';

@NgModule({
  declarations: [
    AppComponent,
    ItemsComponent,
    ItemUnitComponent,
    ItemDescriptionComponent,
    CartComponent,
    CartUnitComponent,
    LogInComponent,
    MeComponent,
    MeRecentBuyComponent,
    AddItemComponent,
    MeStatsBuyComponent,
    WishListComponent,
    WishListUnitComponent,
    PriceDropRecommendationsComponent,
    PopularTagsComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    BrowserAnimationsModule,
    ChartistModule,
    RecaptchaV3Module,
    MatSliderModule,
    NgxSliderModule,
    InfiniteScrollModule,
    ScrollingModule,
    ReactiveFormsModule,
    NgChartsModule,
    MatAutocompleteModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  providers: [
    {
      provide: RECAPTCHA_V3_SITE_KEY,
      useValue: '6LeBPZ4qAAAAAGWaIkJk7Tpb4acAc-SE68An3rCk',
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
