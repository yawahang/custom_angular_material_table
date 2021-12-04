import { Directive, HostListener } from '@angular/core';
@Directive({
    selector: '[matRowSelection]'
})
export class MatRowSelectionDirective {

    allFormControls = [];

    constructor() {
    }

    @HostListener('keydown', ['$event']) onKeyDown(event: any) {

        if ((event?.which == 9 || event?.keyCode == 9)) {

            event.preventDefault();

            const tr = event.srcElement.parentElement.children;

            for (let i = 0; i < (tr || []).length; i++) {

                if (tr && ((event?.srcElement?.parentElement.children[i] || {})?.attributes?.class?.value || '').includes('highlighted')) {

                    if (tr[i + 1]) {

                        tr[i + 1].click()
                        break;
                    } else if ((i + 1) === tr.length) {

                        tr[0].click()
                        break;
                    }
                }
            }
        }
    }
}