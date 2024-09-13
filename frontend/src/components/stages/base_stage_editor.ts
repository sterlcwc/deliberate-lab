import '../../pair-components/textarea';

import {MobxLitElement} from '@adobe/lit-mobx';
import {CSSResultGroup, html, nothing} from 'lit';
import {customElement, property} from 'lit/decorators.js';

import {core} from '../../core/core';
import {ExperimentEditor} from '../../services/experiment.editor';

import {
  StageConfig,
  StageKind,
} from '@deliberation-lab/utils';

import {styles} from './base_stage_editor.scss';

/** Editor for base StageConfig fields. */
@customElement('base-stage-editor')
export class BaseStageEditorComponent extends MobxLitElement {
  static override styles: CSSResultGroup = [styles];

  private readonly experimentEditor = core.getService(ExperimentEditor);

  @property() stage: StageConfig|undefined = undefined;

  override render() {
    if (this.stage === undefined) {
      return nothing;
    }

    return html`
      ${this.renderName()}
      ${this.renderPrimaryText()}
      ${this.renderInfoText()}
      ${this.renderHelpText()}
    `;
  }

  private renderName() {
    const updateName= (e: InputEvent) => {
      const name = (e.target as HTMLTextAreaElement).value;
      if (this.stage) {
        this.experimentEditor.updateStage({ ...this.stage, name });
      }
    };

    return html`
      <pr-textarea
        label="Stage name"
        placeholder="Add stage name"
        variant="outlined"
        .value=${this.stage?.name ?? ''}
        ?disabled=${!this.experimentEditor.canEditStages}
        @input=${updateName}
      >
      </pr-textarea>
    `;
  }

  private renderPrimaryText() {
    const update = (e: InputEvent) => {
      const primaryText = (e.target as HTMLTextAreaElement).value;
      if (this.stage) {
        const descriptions = { ...this.stage.descriptions, primaryText };
        this.experimentEditor.updateStage({ ...this.stage, descriptions });
      }
    };

    return html`
      <pr-textarea
        label="Stage description"
        placeholder="Add description"
        variant="outlined"
        .value=${this.stage?.descriptions.primaryText ?? ''}
        ?disabled=${!this.experimentEditor.canEditStages}
        @input=${update}
      >
      </pr-textarea>
    `;
  }

  private renderInfoText() {
    const update = (e: InputEvent) => {
      const infoText = (e.target as HTMLTextAreaElement).value;
      if (this.stage) {
        const descriptions = { ...this.stage.descriptions, infoText };
        this.experimentEditor.updateStage({ ...this.stage, descriptions });
      }
    };

    return html`
      <pr-textarea
        label="Info popup text"
        placeholder="Add info popup text"
        variant="outlined"
        .value=${this.stage?.descriptions.infoText ?? ''}
        ?disabled=${!this.experimentEditor.canEditStages}
        @input=${update}
      >
      </pr-textarea>
    `;
  }

  private renderHelpText() {
    const update = (e: InputEvent) => {
      const helpText = (e.target as HTMLTextAreaElement).value;
      if (this.stage) {
        const descriptions = { ...this.stage.descriptions, helpText };
        this.experimentEditor.updateStage({ ...this.stage, descriptions });
      }
    };

    return html`
      <pr-textarea
        label="Help popup text"
        placeholder="Add help popup text"
        variant="outlined"
        .value=${this.stage?.descriptions.helpText ?? ''}
        ?disabled=${!this.experimentEditor.canEditStages}
        @input=${update}
      >
      </pr-textarea>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'base-stage-editor': BaseStageEditorComponent;
  }
}