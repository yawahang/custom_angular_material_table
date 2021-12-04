import { Injectable } from "@angular/core";
import { utils as XLSXUtils, writeFile } from "xlsx";
import { WorkBook, WorkSheet } from "xlsx/types";

@Injectable({
  providedIn: "root",
})
export class ExcelExportService {
  fileExtension = ".xlsx";

  public exportAsExcel(option: MvExcelExportOption): void {
    let wb: WorkBook;

    if (option.table) {
      wb = XLSXUtils.table_to_book(option.table);
    } else {
      const ws: WorkSheet = XLSXUtils.json_to_sheet(option.data, {
        header: option.header,
      });
      wb = XLSXUtils.book_new();
      XLSXUtils.book_append_sheet(wb, ws, option.sheetName);
    }

    writeFile(wb, `${option.fileName}${this.fileExtension}`);
  }
}

export interface MvExcelExportOption {
  data: any[];
  fileName: string;
  sheetName?: string;
  header?: string[];
  table?: HTMLElement;
}
