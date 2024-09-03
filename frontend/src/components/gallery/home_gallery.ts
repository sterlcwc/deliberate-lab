import './gallery_card';

import {MobxLitElement} from '@adobe/lit-mobx';
import {CSSResultGroup, html, nothing} from 'lit';
import {customElement} from 'lit/decorators.js';

import {core} from '../../core/core';
import {AuthService} from '../../services/auth.service';
import {HomeService} from '../../services/home.service';
import {Pages, RouterService} from '../../services/router.service';

import { Experiment } from '@deliberation-lab/utils';
import { convertExperimentToGalleryItem } from '../../shared/utils';

import {styles} from './home_gallery.scss';

/** Gallery for home/landing page */
@customElement('home-gallery')
export class HomeGallery extends MobxLitElement {
  static override styles: CSSResultGroup = [styles];

  private readonly authService = core.getService(AuthService);
  private readonly homeService = core.getService(HomeService);
  private readonly routerService = core.getService(RouterService);

  override render() {
    const renderExperiment = (experiment: Experiment) => {
      const item = convertExperimentToGalleryItem(experiment);
      return html`<gallery-card .item=${item}></gallery-card>`;
    };

    return html`
      <div class="gallery-wrapper">
        ${this.homeService.experiments.map(e => renderExperiment(e))}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'home-gallery': HomeGallery;
  }
}