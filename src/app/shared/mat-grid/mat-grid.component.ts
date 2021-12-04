import { SelectionModel } from '@angular/cdk/collections';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { MvGridColumn, MvGridConfig } from './mat-grid.model';
import { ResizeEvent } from 'angular-resizable-element';
import { MatDialog } from '@angular/material/dialog';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MvNavigationActionList } from '../shared.model';
import {
  ExcelExportService,
  MvExcelExportOption,
} from '../excel-export.service';

@Component({
  selector: 'mat-grid',
  templateUrl: './mat-grid.component.html',
  styleUrls: ['./mat-grid.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class MatGridComponent implements OnInit, OnDestroy {
  private _unsubscribeAll: Subject<any>;

  @Output() onPageChange = new EventEmitter<any>();
  @Output() onSortChange = new EventEmitter<any>();
  @Output() onRowClick = new EventEmitter<any>();
  @Output() onRowActionClick = new EventEmitter<any>();
  @Output() onRowDblClick = new EventEmitter<any>();
  @Output() onCheckAll = new EventEmitter<any>();
  @Output() onCheckBoxChange = new EventEmitter<any>();

  @Input('config') set config(conf: MvGridConfig) {
    if (conf) {
      if (conf?.dataSource?.data.length) {
        if (typeof this.currentSize === 'number') {
          // fetch next
          this.gridData.length = this.currentSize || 0;
          this.gridData.push(...(conf?.dataSource?.data || []));
          this.gridData.length = conf?.dataSource?.totalRows || 0;
        } else {
          this.gridData = conf?.dataSource?.data || [];
          this.gridData.length = conf.dataSource.totalRows || 0;
        }
      } else {
        this.gridData = [];
        this.gridData.length = 0;
      }

      this.gridColumns = conf?.columns || [];

      const stickyCol = this.gridColumns.filter(
        (col: MvGridColumn) => col?.sticky
      );
      if (stickyCol && stickyCol.length > 0) {
        this.isSticky = true;
      }

      const disableSort = this.gridColumns.filter(
        (col: MvGridColumn) => col?.disableSort
      );
      if (disableSort && disableSort.length > 0) {
        this.isSortable = false;
      }

      this.actionColumns = this.gridColumns
        .filter((col: MvGridColumn) => col?.type === 'action')
        .map((col: MvGridColumn) => col?.name);
      if (this.displayedColumns.length === 0) {
        // affects column order if re-assigned
        this.displayedColumns = this.gridColumns.map(
          (col: MvGridColumn) => col?.name
        );
      }

      this.checkColumns = this.gridColumns
        .filter((col: MvGridColumn) => col?.type === 'checkBox')
        .map((col: MvGridColumn) => col?.name);

      if (!this.selection) {
        if (this.checkColumns.length > 0) {
          this.selection = new SelectionModel<any>(true, []);
        } else {
          this.selection = new SelectionModel<any>(false, []);
        }
      }

      if (!this.gridConfig) {
        // grid initialization

        this.gridConfig = { ...conf };
        if (conf?.rowActionOption) {
          this.dblClickNavigationAction =
            conf?.rowActionOption?.dblClickNavigationAction;
          this.getNavigationAction();
        }
      }

      if (
        this.gridConfig.option.searchText !== conf.option.searchText &&
        this.dataSource.paginator
      ) {
        // grid search change
        this.dataSource.paginator.firstPage();
      }

      this.gridConfig.option = conf?.option;
      this.gridConfig.rowActionOption = conf?.rowActionOption;
      this.gridConfig.fileName = conf?.fileName;

      this.rowTooltip = conf?.rowTooltip || this.rowTooltip;
      this.loading = conf?.loading;
      this.setTableDataSource();
    }
  }

  @Input('rowTemplateOption') set rowTemplateOption(tpl: any) {
    if (tpl) {
      this.rowTemplate = tpl;
    }
  }

  rowTemplate: any = {};

  @ViewChild('tableEl', { static: true })
  tableEl!: ElementRef;
  @ViewChild(MatPaginator, { static: true })
  paginator!: MatPaginator | null;
  @ViewChild(MatSort, { static: true })
  sort!: MatSort;

  gridColumns: MvGridColumn[] = [];
  dataSource!: MatTableDataSource<any>;
  gridData: any[] = [];

  totalRows: number | undefined;
  selection: SelectionModel<any> | undefined;
  gridConfig: MvGridConfig | undefined;

  isSticky = false;
  isSortable = true;
  displayedColumns: string[] = [];
  actionColumns: string[] = [];
  checkColumns: string[] = [];
  gridColumnOption: any;
  pageSizeOptions: number[] = [];
  noRecordMessage = '';
  selectedRow: any = <any>{};
  loading = true;
  currentSize: any;

  navigationAction: MvNavigationActionList[] = [];
  dblClickNavigationAction: string | undefined;
  gridRowActionExpanded = false; // true = inline icon actions, false = menu actions

  rowTooltip = '';

  pressed = false;
  currentResizeIndex: number | undefined;
  startX: number | undefined;
  startWidth: number | undefined;
  isResizingRight: boolean | undefined;
  resizableMousemove: (() => void) | undefined;
  resizableMouseup: (() => void) | undefined;
  // Column Resize

  constructor(
    public dialog: MatDialog,
    private excelSrv: ExcelExportService,
    private renderer: Renderer2
  ) {
    this._unsubscribeAll = new Subject();
  }

  ngOnInit() {
    // Grid Start
    this.gridColumnOption = {
      format: {
        money: '1.3-3',
        percent: '1.3-3',
        decimal: '1.3-3',
        number: '1.0',
        date: 'yyyy/MM/dd',
        dateTime: 'yyyy/MM/dd hh:mm aa',
      },
      prefix: {
        money: 'Rs',
      },
      suffix: {
        percent: '%',
      },
    };
    this.noRecordMessage = 'No records found!';
    this.pageSizeOptions = [10, 25, 50, 100];
    this.gridRowActionExpanded = false;
  }

  pageChange(e: PageEvent) {
    this.loading = true;
    if (this.gridConfig) {
      this.gridConfig.option.pageSize = e?.pageSize || 10;
      this.gridConfig.option.offset =
        (e?.pageIndex || 0) * this.gridConfig?.option?.pageSize;
    }
    this.currentSize = e.pageSize * e.pageIndex;
    this.onPageChange.emit({
      offset: this.gridConfig?.option?.offset,
      pageSize: this.gridConfig?.option?.pageSize,
    });
  }

  sortChange(e: Sort) {
    this.loading = true;
    if (this.gridConfig) {
      this.gridConfig.option.sortBy =
        e?.active || this.gridConfig?.option?.sortBy;
      this.gridConfig.option.sortOrder = e?.direction || 'ASC';
    }
    this.onSortChange.emit({
      sortBy: this.gridConfig?.option?.sortBy,
      sortOrder: this.gridConfig?.option?.sortOrder,
    });
  }

  setTableDataSource() {
    if (this.actionColumns.length > 0) {
      // add row data for actions
      this.gridData.forEach((data: any) => {
        this.actionColumns.forEach((col: string) => {
          data[col] = null;
        });
      });
    }

    if (this.checkColumns.length > 0) {
      // check columns, select checked rows
      this.gridData.forEach((row) => this.selection?.select(row));
      this.onCheckAll.emit(this.selection?.selected);
    }

    this.dataSource = new MatTableDataSource<any>(this.gridData);
    this.dataSource._updateChangeSubscription();
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  rowClick(row: any) {
    this.selectedRow = { ...row };
    this.selection?.toggle(row);
    this.onRowClick.emit({ ...row });
  }

  rowActionClick(nav: MvNavigationActionList, row: any) {
    if (nav && row) {
      this.selectedRow = { ...row };
      this.selection?.toggle(row);
      this.onRowActionClick.emit({
        action: { ...nav },
        row: { ...row },
      });
    }
  }

  rowDblClick(row: any) {
    const navAccess = this.navigationAction.filter(
      (n: MvNavigationActionList) =>
        n.navigationAction === this.dblClickNavigationAction
    );
    if (navAccess && navAccess.length > 0) {
      this.selectedRow = { ...row };
      this.selection?.toggle(row);
      this.onRowDblClick.emit({ ...row });
    } else {
      window.alert("You don't have access");
    }
  }

  getNavigationAction() {
    let navActList: MvNavigationActionList[] = [
      {
        navigationActionId: 33,
        navigationAction: 'Add',
        icon: 'add_circle',
        showInGrid: false,
      },
      {
        navigationActionId: 34,
        navigationAction: 'Edit',
        icon: 'edit',
        showInGrid: true,
      },
      {
        navigationActionId: 35,
        navigationAction: 'Import',
        icon: 'cloud_upload',
        showInGrid: false,
      },
      {
        navigationActionId: 36,
        navigationAction: 'Refresh',
        icon: 'refresh',
        showInGrid: false,
      },
    ];

    this.navigationAction = navActList.filter(
      (n: MvNavigationActionList) => n.showInGrid
    );
    let action = '';
    this.navigationAction.map((n: MvNavigationActionList) => {
      action = n.navigationAction.toLowerCase();
      n.color = action.includes('add')
        ? 'primary'
        : action.includes('edit')
        ? 'accent'
        : 'basic';
    });
  }

  checkBoxChange(row: any) {
    if (row) {
      this.selection?.toggle(row);
      this.onCheckBoxChange.emit(this.selection?.selected);
    }
  }

  // Whether the number of selected elements matches the total number of rows
  isAllSelected() {
    const numSelected = this.selection?.selected.length;
    return numSelected === this.totalRows;
  }

  // Selects all rows if they are not all selected; otherwise clear selection
  checkAll() {
    this.isAllSelected()
      ? this.selection?.clear()
      : this.dataSource?.data.forEach((row) => this.selection?.select(row));
    this.onCheckAll.emit(this.selection?.selected);
  }

  rowActionHeaderClick() {
    this.gridRowActionExpanded = !this.gridRowActionExpanded;
  }

  // Column Resize
  // onResizeEnd(event: ResizeEvent, columnName: string): void
  onResizeEnd(event: any, columnName: string): void {
    if (event.edges.right) {
      const cssValue = event.rectangle.width + 'px';
      const columnEl = document.getElementsByClassName(
        'mat-column-' + columnName
      );
      for (let i = 0; i < columnEl.length; i++) {
        const currentEl = columnEl[i] as HTMLDivElement;
        currentEl.style.width = cssValue;
      }
    }
  }
  // Column Resize

  // Column ReOrder
  columnDrop(event: CdkDragDrop<string[]>) {
    moveItemInArray(
      this.displayedColumns,
      event.previousIndex,
      event.currentIndex
    );
  }
  // Column ReOrder

  excelExportClick() {
    let excelOpt: MvExcelExportOption = {} as MvExcelExportOption;
    excelOpt.fileName =
      (this.gridConfig?.fileName || 'Excel_Export_File') +
      '_' +
      new Date()
        .toISOString()
        .substring(0, 10)
        .replace('-', '_')
        .replace('-', '_'); // new Date().toISOString().substring(0, 10).replaceAll('-','_');
    excelOpt.sheetName = this.gridConfig?.sheetName || 'Sheet1';

    let data = [
      ...new Set(
        [...(this.gridConfig?.dataSource?.data || [])].map((o) =>
          JSON.stringify(o)
        )
      ),
    ].map((s) => JSON.parse(s));
    let columns: string[] = this.gridColumns
      .map((x: MvGridColumn) => {
        const d: string = x?.display?.replace(' ', '') || '';
        if (!['actions', 'hovered'].includes(d?.toLowerCase())) {
          return d;
        }
        return '';
      })
      .filter((v: any) => ![null, undefined].includes(v));

    if (data && data[0]) {
      Object.keys(data[0]).map((c: any) => {
        const col = columns.find((cl) => cl.toLowerCase() === c.toLowerCase());
        if (col) {
          data.map((v: any) => {
            v[col] = v[c];
            delete v[c];
          });
        } else {
          data.map((v: any) => {
            delete v[c];
          });
        }
      });
    }

    excelOpt.data = data;
    excelOpt.header = columns || [];
    this.excelSrv.exportAsExcel(excelOpt);
  }

  ngOnDestroy(): void {}
}
