import type { MaritimeServiceHandler } from '../../../../src/generated/server/worldmonitor/maritime/v1/service_server';

import { getVesselSnapshot } from './get-vessel-snapshot';
import { getVesselTrack } from './get-vessel-track';
import { listNavigationalWarnings } from './list-navigational-warnings';
import { listPortEvents } from './list-port-events';
import { searchVessels } from './search-vessels';

export const maritimeHandler: MaritimeServiceHandler = {
  getVesselSnapshot,
  getVesselTrack,
  listNavigationalWarnings,
  listPortEvents,
  searchVessels,
};
