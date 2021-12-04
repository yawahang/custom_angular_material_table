export interface MvGridConfig {
  columns: MvGridColumn[];
  dataSource: {
    data: any[];
    totalRows: number;
  };
  loading: boolean;
  rowTooltip?: string;
  rowActionOption?: MvGridRowActionOption;
  fileName: string; // excel export file name
  sheetName?: string; // excel export sheet name
  option: MvGridOption;
}

export interface MvGridOption {
  searchText?: string;
  filter?: any;
  offset?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface MvGridPaging {
  offset?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface MvGridRowActionOption {
  navigationId: number;
  dblClickNavigationAction: string;
}

export interface MvGridColumn {
  name: string; // column name
  display?: string; // column display name
  type: string; // Action (For grid inline row actions), Text, Number, Percent, Money, Date, DateTime, CheckBox, Template
  templateColumns?: string[]; // TemplateColumn is the list of columns which is to be shown as template in current column
  /*
        Formats are added by default, use this property if custom format needed
        Defaults: AppConst.data.gridOptions.GridColumnOption.Format
    */
  format?: string;
  cellColor?: string; // change the color of cell text
  cellInfoText?: string; // pass information sentence if needed to show info icon with information in tooltip on hover
  sticky?: boolean; // sticky header - false by default (row Actions should always be sticky)
  disableSort?: boolean; // disable column sort - false by default
  /*
        Cell prefix like $ or Rs 
        Defaults: AppConst.data.gridOptions.GridColumnOption.Prefix
   */
  prefix?: string;
  /*
        Cell suffix like % 
        Defaults: AppConst.data.gridOptions.GridColumnOption.Suffix
   */
  suffix?: string;
  hidden?: boolean; // hidden columns
  width?: number; // column width
}
