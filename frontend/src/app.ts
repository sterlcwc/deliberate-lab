import './pair-components/button';

import './components/gallery/home_gallery';
import './components/header/header';
import './components/login/login';
import './components/settings/settings';
import './components/sidenav/experimenter_sidenav';

import {MobxLitElement} from '@adobe/lit-mobx';
import {CSSResultGroup, html, nothing, TemplateResult} from 'lit';
import {customElement} from 'lit/decorators.js';
import {classMap} from 'lit/directives/class-map.js';

import {core} from './core/core';
import {AuthService} from './services/auth.service';
import {HomeService} from './services/home.service';
import {Pages, RouterService} from './services/router.service';
import {SettingsService} from './services/settings.service';

import {ColorMode, ColorTheme, TextSize} from './shared/types';

import {styles} from './app.scss';

/** App main component. */
@customElement('deliberation-lab')
export class App extends MobxLitElement {
  static override styles: CSSResultGroup = [styles];

  private readonly authService = core.getService(AuthService);
  private readonly homeService = core.getService(HomeService);
  private readonly routerService = core.getService(RouterService);
  private readonly settingsService = core.getService(SettingsService);

  override connectedCallback() {
    super.connectedCallback();
  }

  private renderPageContent() {
    switch (this.routerService.activePage) {
      case Pages.HOME:
        return html`
          <div class="content">
            <home-gallery></home-gallery>
          </div>
        `;
      case Pages.SETTINGS:
        return html`
          <div class="content">
            <settings-page .showAccount=${true}></settings-page>
          </div>
        `;
      case Pages.EXPERIMENT_CREATE:
        return html`
          <div class="content">
            <div>New experiment</div>
          </div>
        `;
      default:
        return this.render404();
    }
  }

  private render404(message = 'Page not found') {
    return html`<div class="content">404: ${message}</div>`;
  }

  private render403(message = 'Participants do not have access') {
    return html`<div class="content">403: ${message}</div>`;
  }

  override render() {
    const isMode = (mode: ColorMode) => {
      return this.settingsService.colorMode === mode;
    };

    const isTheme = (theme: ColorTheme) => {
      return this.settingsService.colorTheme === theme;
    };

    const isSize = (size: TextSize) => {
      return this.settingsService.textSize === size;
    };

    const classes = classMap({
      'app-wrapper': true,
      'mode--dark': isMode(ColorMode.DARK),
      'mode--light': isMode(ColorMode.LIGHT),
      'mode--default': isMode(ColorMode.DEFAULT),
      'size--small': isSize(TextSize.SMALL),
      'size--medium': isSize(TextSize.MEDIUM),
      'size--large': isSize(TextSize.LARGE),
    });

    if (
      !this.authService.authenticated &&
      !this.routerService.isParticipantPage &&
      this.routerService.activeRoute.params['experiment'] === undefined
    ) {
      // Render login screen if relevant after initial auth check
      return html`
        <div class=${classes}>
          <div class="content">
            ${this.authService.initialAuthCheck
              ? html`<login-page></login-page>`
              : nothing}
          </div>
        </div>
      `;
    }

    return html`
      <div class=${classes}>
        <main>
          <experimenter-sidenav></experimenter-sidenav>
          <div class="content-wrapper">
            <page-header></page-header>
            ${this.renderPageContent()}
          </div>
          <sidenav-menu></sidenav-menu>
        </main>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deliberation-lab': App;
  }
}