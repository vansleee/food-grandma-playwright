import type { Page } from '@playwright/test';
import { DriverSignInPage, DriverWorkspacePage } from './driver-pages';

export class DriverDeliveryWorkflow {
  private readonly signIn: DriverSignInPage;
  private readonly workspace: DriverWorkspacePage;

  constructor(page: Page) {
    this.signIn = new DriverSignInPage(page);
    this.workspace = new DriverWorkspacePage(page);
  }

  async openActiveDeliveries() {
    await this.signIn.enterWorkspace();
    await this.workspace.openActiveDeliveries();
  }
}
