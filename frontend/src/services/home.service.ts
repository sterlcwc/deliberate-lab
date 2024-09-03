import {
  Experiment,
  StageConfig,
  createExperimentConfig,
} from '@deliberation-lab/utils';
import {
  Unsubscribe,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import {computed, makeObservable, observable} from 'mobx';
import {
  writeExperimentCallable,
  deleteExperimentCallable,
} from '../shared/callables';
import {collectSnapshotWithId} from '../shared/utils';

import {AuthService} from './auth.service';
import {FirebaseService} from './firebase.service';
import {Service} from './service';

interface ServiceProvider {
  authService: AuthService;
  firebaseService: FirebaseService;
}

/**
 * Handle home/landing experimenter views:
 * - List experiments
 * - List experiment templates
 * - List agent templates
 */
export class HomeService extends Service {
  constructor(private readonly sp: ServiceProvider) {
    super();
    makeObservable(this);
  }

  @observable experiments: Experiment[] = [];
  @observable experimentTemplates: Experiment[] = [];

  // Loading
  @observable unsubscribe: Unsubscribe[] = [];
  @observable areExperimentsLoading = true;
  @observable areExperimentTemplatesLoading = true;

  @computed get isLoading() {
    return this.areExperimentsLoading || this.areExperimentTemplatesLoading;
  }

  subscribe() {
    // Subscribe to relevant experiment documents
    const experimentQuery = query(
      collection(this.sp.firebaseService.firestore, 'experiments'),
      where('metadata.creator', '==', this.sp.authService.userId)
    );

    this.unsubscribe.push(
      onSnapshot(
        experimentQuery,
        (snapshot) => {
          this.experiments = collectSnapshotWithId<Experiment>(snapshot, 'id');
          this.areExperimentsLoading = false;
        }
      )
    );

    // Subscribe to all experiment template documents
    const experimentTemplateQuery = query(
      collection(this.sp.firebaseService.firestore, 'experimentTemplates'),
      where('metadata.creator', '==', this.sp.authService.userId)
    );
    this.unsubscribe.push(
      onSnapshot(
        experimentTemplateQuery,
        (snapshot) => {
          this.experimentTemplates = collectSnapshotWithId<Experiment>(
            snapshot,
            'id'
          );
          this.areExperimentTemplatesLoading = false;
        }
      )
    );
  }

  unsubscribeAll() {
    this.unsubscribe.forEach((unsubscribe) => unsubscribe());
    this.unsubscribe = [];

    // Reset observables
    this.experiments = [];
    this.experimentTemplates = [];
  }

  getExperiment(experimentId: string) {
    return this.experiments.find((exp) => exp.id === experimentId);
  }

  // *********************************************************************** //
  // FIRESTORE                                                               //
  // *********************************************************************** //

  /** Create or update an experiment.
   * @rights Experimenter
   */
  async writeExperiment(
    stages: StageConfig[] = [],
    experiment: Partial<Experiment> = {},
  ) {
    return writeExperimentCallable(this.sp.firebaseService.functions, {
      collectionName: 'experiments',
      experimentConfig: createExperimentConfig(stages, experiment),
      stageConfigs: [],
    });
  }

  /** Delete an experiment.
   * @rights Experimenter
   */
  async deleteExperiment(experimentId: string) {
    return deleteExperimentCallable(this.sp.firebaseService.functions, {
      collectionName: 'experiments',
      experimentId: experimentId,
    });
  }
}