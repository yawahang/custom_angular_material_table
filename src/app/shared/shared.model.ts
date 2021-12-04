export interface MvNavigationActionList {
  navigationActionId: number;
  navigationAction: string;
  icon: string;
  color?: string;
  class?: string;
  showInGrid?: boolean | false; // shown in grid row action
}
