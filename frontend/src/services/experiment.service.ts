import {computed, makeObservable, observable} from 'mobx';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import {FirebaseService} from './firebase.service';
import {Pages, RouterService} from './router.service';
import {Service} from './service';

import {
  Experiment,
  StageConfig,
} from '@deliberation-lab/utils';

interface ServiceProvider {
  firebaseService: FirebaseService;
  routerService: RouterService;
}

/**
 * Configs (experiment, stages, roles) for current experiment.
 * To manage cohorts or participants, see experiment.manager.ts
 */
export class ExperimentService extends Service {
  constructor(private readonly sp: ServiceProvider) {
    super();
    makeObservable(this);
  }

  // Experiment configs
  @observable experiment: Experiment | undefined = undefined;
  @observable stageConfigMap: Record<string, StageConfig> = {};
  // TODO: Add roleConfigMap

  // Loading
  @observable unsubscribe: Unsubscribe[] = [];
  @observable isExperimentLoading = false;
  @observable isStageConfigsLoading = false;

  @computed get isLoading() {
    return (
      this.isExperimentLoading ||
      this.isStageConfigsLoading
    );
  }

  set isLoading(value: boolean) {
    this.isExperimentLoading = value;
    this.isStageConfigsLoading = value;
  }

  updateForCurrentRoute() {
    const id = this.sp.routerService.activeRoute.params['experiment'];
    if (id !== this.experiment?.id) {
      this.loadExperiment(id);
    }
  }

  loadExperiment(id: string) {
    this.unsubscribeAll();
    this.isLoading = true;

    // Subscribe to the experiment
    this.unsubscribe.push(
      onSnapshot(
        doc(this.sp.firebaseService.firestore, 'experiments', id),
        (doc) => {
          this.experiment = {id: doc.id, ...doc.data()} as Experiment;
          this.isExperimentLoading = false;
        }
      )
    );

    // Fetch the experiment config
    this.unsubscribe.push(
      onSnapshot(
        collection(
          this.sp.firebaseService.firestore,
          'experiments',
          id,
          'stages'
        ),
        (snapshot) => {
          let changedDocs = snapshot.docChanges().map((change) => change.doc);
          if (changedDocs.length === 0) {
            changedDocs = snapshot.docs;
          }

          changedDocs.forEach((doc) => {
            const data = doc.data() as StageConfig;
            this.stageConfigMap[doc.id] = data;
          });

          this.isStageConfigsLoading = false;
        }
      )
    );
  }

  unsubscribeAll() {
    this.unsubscribe.forEach((unsubscribe) => unsubscribe());
    this.unsubscribe = [];

    // Reset stage configs
    this.stageConfigMap = {};
    this.experiment = undefined;
  }

  @computed get experimentName() {
    return this.experiment?.metadata?.name ?? 'Experiment';
  }

  @computed get stageIds(): string[] {
    return this.experiment?.stageIds ?? [];
  }

  @computed get stages(): StageConfig[] {
    const stages: StageConfig[] = [];
    for (const id of this.stageIds) {
      if (this.stageConfigMap[id]) {
        stages.push(this.stageConfigMap[id]);
      }
    }
    return stages;
  }

  getStage(stageId: string) {
    return this.stageConfigMap[stageId];
  }

  getStageName(stageId: string, withNumber = false) {
    if (this.isLoading) {
      return 'Loading...';
    }

    const stageNum = withNumber ? `${this.getStageIndex(stageId) + 1}. ` : '';
    return `${stageNum}${this.stageConfigMap[stageId]?.name}`;
  }

  getStageIndex(stageId: string) {
    return this.stageIds.indexOf(stageId);
  }

  getNextStageId(stageId: string) {
    const currentIndex = this.getStageIndex(stageId);
    if (currentIndex >= 0 && currentIndex < this.stageIds.length - 1) {
      return this.stageIds[currentIndex + 1];
    }
    return null;
  }
}