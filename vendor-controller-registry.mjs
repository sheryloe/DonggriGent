import { WebPromptController } from './web-prompt-controller.mjs';
import { profileByVendorId } from './vendor-profiles.mjs';

export class VendorControllerRegistry {
  constructor({ profiles = [], stateDir } = {}) {
    this.profiles = Array.isArray(profiles) ? profiles : [];
    this.stateDir = stateDir || null;
  }

  getProfile(vendorId) {
    return profileByVendorId(this.profiles, vendorId);
  }

  listVendors() {
    return this.profiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
      url: profile.startUrl || profile.url,
      status: profile.status
    }));
  }

  async createController({ tabId, page, vendorId, vendorName, onBlocked, onUnblocked }) {
    const profile = this.getProfile(vendorId);
    const controller = new WebPromptController({
      page,
      profile,
      vendorId: vendorId || profile?.id,
      vendorName: vendorName || profile?.name,
      stateDir: this.stateDir,
      onBlocked,
      onUnblocked
    });
    controller.tabId = tabId;
    return controller;
  }
}

