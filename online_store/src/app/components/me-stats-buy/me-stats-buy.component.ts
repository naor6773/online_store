import { Item } from '../../Item';
import { Component, OnInit } from '@angular/core';
import { UsersService } from '../../services/users.service';
import { AuthService } from '../../AuthService';

interface SalesItem {
  name: string;
  totalQuantityForMonth: number;
  currentMonthSales: any[];
}

@Component({
  selector: 'app-me-stats-buy',
  templateUrl: './me-stats-buy.component.html',
  styleUrls: ['./me-stats-buy.component.css'],
})
export class MeStatsBuyComponent implements OnInit {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
  ) {}

  configuration: any;
  events: any = {};

  username: string = '';

  this_month_sales: number = 0;
  this_year_sales: number = 0;
  this_five_years_sales: number = 0;

  this_month_sales_per_item: number[] = [];

  type: string = 'Bar';
  data: any;
  options: any;
  responsiveOptions: any;

  ngOnInit(): void {
    // fetch the current user
    this.authService.fetchMe().subscribe({
      next: (user) => {
        this.username = user.username;

        console.log('urrent user 13213', this.username);

        const currentYear = new Date().getFullYear();
        console.log('this year' + currentYear);

        const currentMonth = (new Date().getMonth() + 1)
          .toString()
          .padStart(2, '0');
        console.log('this month' + currentMonth);

        //call the servise to get the admin sales per year/month
        this.usersService.getSalesHistory(this.username.toString()).subscribe(
          (salesHistory) => {
            //inlize the sales for this moneth,year,5 years
            this.this_month_sales =
              salesHistory.salesHistoryByMonth[
                currentYear + '-' + currentMonth
              ] ?? 0;
            console.log('sales this month' + this.this_month_sales);
            this.this_year_sales =
              salesHistory.salesHistoryByYear[currentYear] ?? 0;
            this.this_five_years_sales = this.this_year_sales ?? 0;
            for (let i = 1; i < 5; i++) {
              const year = currentYear - i;
              this.this_five_years_sales +=
                salesHistory.salesHistoryByYear[year] ?? 0;
            }

            console.log('out');

            //call the serivse to get the  sales history for the 2 top best items, and 2 worst items
            this.usersService
              .getSalesHistoryForTopAndWorstItems(this.username.toString())
              .subscribe(
                (salesHistoryForItems) => {
                  console.log('init');

                  //intialize the sales for the 2 top best items, and 2 worst items this moneth
                  const finalItems: SalesItem[] =
                    salesHistoryForItems.finalItems;

                  //push the sales for eatch item!
                  finalItems.forEach((item: SalesItem) => {
                    const itemSales = item.totalQuantityForMonth ?? 0;
                    console.log(
                      'itemSales for ' + item.name + ': ' + itemSales,
                    );
                    this.this_month_sales_per_item.push(itemSales);
                  });

                  //dynamic lables for the grath
                  let itemLabels = [
                    'best selling item',
                    'secend best selling item',
                    'worst selling item',
                    'worst best selling item',
                  ];

                  //change num of lables base on the num of items(max 4)
                  itemLabels = itemLabels.slice(
                    0,
                    salesHistoryForItems.itemCount,
                  );

                  //inlize grath settings
                  this.configuration = {
                    //inlize grath type

                    type: 'Bar',
                    data: {
                      //inlize alltime lables and dynamic items lables

                      labels: [
                        ...itemLabels,
                        'All Items This Month',
                        'All Items This Year',
                        'All Items 5 Years',
                      ],
                      //inlize alltime data and dynamic items data

                      series: [
                        [
                          ...this.this_month_sales_per_item,
                          this.this_month_sales,
                          this.this_year_sales,
                          this.this_five_years_sales,
                        ],
                      ],
                    },
                    //disine the grath
                    options: {
                      height: '300px',
                    },
                  };

                  console.log('init_after');
                },
                (error) => {
                  console.error(
                    'Error loading sales history for items:',
                    error,
                  );
                },
              );
          },
          (error) => {
            console.error('Error loading sales history:', error);
          },
        );
      },
      error: (err) => {
        console.error('Error fetching current user:', err);
      },
    });
  }
}
