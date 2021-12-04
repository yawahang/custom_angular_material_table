import { gridData } from './app.data';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { gridColumns } from './app.column';
import { MvGridConfig, MvGridPaging } from './shared/mat-grid/mat-grid.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'custom-angular-material-table';

  // Grid Start
  gridConfig = {
    columns: [],
    dataSource: {
      data: [],
      totalRows: 0,
    },
    loading: true,
    fileName: 'Company_Export',
    option: {
      searchText: '',
      filter: {
        statusIdList: [],
      },
      offset: 0,
      pageSize: 10,
      sortBy: 'name',
      sortOrder: 'ASC',
    },
    rowActionOption: {
      dblClickNavigationAction: 'Edit',
    },
  } as unknown as MvGridConfig;

  selectedRow: any = <any>{};
  // Grid End

  ngOnInit(): void {
    this.gridConfig.columns = gridColumns;
    this.gridConfig.dataSource.data = gridData || [];
    this.gridConfig.dataSource.totalRows = gridData.length || 0;
    this.gridConfig.loading = false;
    this.gridConfig = { ...this.gridConfig }; // refresh gridConfig
  }

  // Grid Start
  onRowDblClick(row: any) {
    this.selectedRow = { ...row }; 
    console.log('Edit');
  }

  onRowClick(row: any) {
    this.selectedRow = { ...row };
  }

  onPageChange(event: MvGridPaging) {
    if (event) {
      this.gridConfig.option.offset = event.offset;
      this.gridConfig.option.pageSize = event.pageSize;
      console.log('get grid data from server');
    }
  }

  onSortChange(event: MvGridPaging) {
    if (event) {
      this.gridConfig.option.sortBy = event.sortBy;
      this.gridConfig.option.sortOrder = event.sortOrder;
      console.log('get grid data from server');
    }
  }

  onRowActionClick(event: any) {
    if (event && event?.action && event?.row) {
      this.selectedRow = { ...event?.row };
      switch (event?.action?.NavigationAction) {
        case 'Edit':
          console.log('Edit');
          break;
      }
    }
  }
  // Grid End

  ngOnDestroy(): void {}
}
