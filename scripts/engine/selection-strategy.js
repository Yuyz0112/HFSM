import { r } from '../utils';

export const randomStrategy = actions =>
  actions.find((action, index) => r((index + 1) / actions.length));
