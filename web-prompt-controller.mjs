import { ChatGPTController } from './chatgpt-controller.mjs';

export class WebPromptController extends ChatGPTController {
  constructor({ page, profile, selectors, vendorId, vendorName, ...rest }) {
    super({
      page,
      selectors: profile?.selectors || selectors,
      ...rest
    });
    this.profile = profile || null;
    this.vendorId = String(vendorId || profile?.id || 'chatgpt').trim() || 'chatgpt';
    this.vendorName = String(vendorName || profile?.name || 'ChatGPT').trim() || 'ChatGPT';
  }
}

