// popular-tags.component.ts
import { Component, OnInit } from '@angular/core';
import { ItemService } from '../../services/item.service';
import { ChartOptions, ChartData } from 'chart.js';

interface PopularTag {
  tag: string;
  count: number;
}

@Component({
  selector: 'app-popular-tags',
  templateUrl: './popular-tags.component.html',
  styleUrls: ['./popular-tags.component.css'],
})
export class PopularTagsComponent implements OnInit {
  error: string = '';

  categories: string[] = [];
  isOpen: { [cat: string]: boolean } = {};
  popularTagsForCategory: { [cat: string]: PopularTag[] } = {};

  chartDataForCategory: { [cat: string]: ChartData<'bar'> } = {};

  chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Popular Tags in Top 10% Products by Category',
      },
    },
  };
  chartType: 'bar' = 'bar';

  colorPalette: string[] = [
    '#FF6384',
    '#36A2EB',
    '#FFCE56',
    '#4BC0C0',
    '#9966FF',
    '#FF9F40',
    '#C9CBCF',
    '#FF6384',
    '#36A2EB',
    '#FFCE56',
  ];

  constructor(private itemService: ItemService) {}

  ngOnInit(): void {
    // load the list of categories
    this.itemService.getPopularTagsCategories().subscribe({
      next: (cats) => {
        this.categories = cats;
      },
      error: (err) => {
        console.error('Error fetching categories:', err);
        this.error = 'Failed to load categories.';
      },
    });
  }

  // toggle a category open/close
  onToggleCategory(category: string): void {
    this.isOpen[category] = !this.isOpen[category];

    // if just opened and not yet loaded tags, fetch from server
    if (this.isOpen[category] && !this.popularTagsForCategory[category]) {
      this.loadCategoryTags(category);
    }
  }

  // fetch tags for that category
  loadCategoryTags(category: string) {
    this.itemService.getPopularTagsByCategory(category).subscribe({
      next: (tags) => {
        this.popularTagsForCategory[category] = tags;
        this.prepareChartData(category, tags);
      },
      error: (err) => {
        console.error('Error fetching popular tags:', err);
        this.error = 'Failed to load popular tags.';
      },
    });
  }

  // build a chart for this category only
  prepareChartData(category: string, tags: PopularTag[]) {
    const allTags = tags.map((t) => t.tag);

    const dataset = {
      label: category,
      data: tags.map((t) => t.count),
      backgroundColor: this.colorPalette[0],
    };

    this.chartDataForCategory[category] = {
      labels: allTags,
      datasets: [dataset],
    };
  }
}
