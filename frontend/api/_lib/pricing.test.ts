import { describe, it, expect } from 'vitest';
import { imageModelCost, threeDTierCost, totalPipelineCost } from './pricing';

describe('pricing', () => {
  it('flux-2-turbo is $0.008 per image', () => {
    expect(imageModelCost('flux-2-turbo', 1)).toBeCloseTo(0.008);
    expect(imageModelCost('flux-2-turbo', 4)).toBeCloseTo(0.032);
  });
  it('flux-2-pro is $0.03 per image', () => {
    expect(imageModelCost('flux-2-pro', 1)).toBeCloseTo(0.03);
  });
  it('fast 3D tier is Trellis at $0.02', () => {
    expect(threeDTierCost('fast')).toBeCloseTo(0.02);
  });
  it('pro 3D tier is Rodin at $0.40', () => {
    expect(threeDTierCost('pro')).toBeCloseTo(0.4);
  });
  it('totalPipelineCost sums image + 3D', () => {
    expect(totalPipelineCost('flux-2-turbo', 4, 'fast')).toBeCloseTo(0.032 + 0.02);
  });
});
