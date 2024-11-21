type Resources = {
  food: number;
  fuel: number;
};

type Dwelling = {
  id: string;
  max_occupancy: number;
  current_occupancy: number;
  resources: Resources;
  swarmCount: number;
  hasSpecialForces: boolean;
  hasMedic: boolean;
};

export default {
  dwellings: Array<Dwelling>,
};
