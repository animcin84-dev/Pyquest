import { PERKS, type Perk } from '../constants/perks';

export type PerkBonusType = Perk['bonus']['type'];

export const getOwnedPerks = (perkIds: string[] | undefined) => {
  const ownedIds = new Set(perkIds || []);
  return PERKS.filter(perk => ownedIds.has(perk.id));
};

export const getPerkBonusTotal = (
  perkIds: string[] | undefined,
  bonusType: PerkBonusType
) => getOwnedPerks(perkIds)
  .filter(perk => perk.bonus.type === bonusType)
  .reduce((total, perk) => total + perk.bonus.value, 0);
