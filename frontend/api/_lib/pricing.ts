import type { GenerateImageRequest, Generate3DRequest } from './zod-schemas';

type ImageModel = GenerateImageRequest['model'];
type Tier = Generate3DRequest['tier'];

const IMAGE_COST_PER_CALL: Record<ImageModel, number> = {
  'flux-2-turbo': 0.008,
  'flux-2-pro': 0.03,
  'flux-2-dev': 0.012,
};

const TIER_COST: Record<Tier, number> = {
  fast: 0.02,
  balanced: 0.16,
  pro: 0.4,
};

export const imageModelCost = (model: ImageModel, batch: number): number =>
  IMAGE_COST_PER_CALL[model] * batch;

export const threeDTierCost = (tier: Tier): number => TIER_COST[tier];

export const totalPipelineCost = (model: ImageModel, batch: number, tier: Tier): number =>
  imageModelCost(model, batch) + threeDTierCost(tier);
