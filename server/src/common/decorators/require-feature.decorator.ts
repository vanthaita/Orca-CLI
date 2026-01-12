import { SetMetadata } from '@nestjs/common';
import { FeaturePermission } from '../enums/feature-permission.enum';

export const FEATURE_KEY = 'required_features';
export const RequireFeature = (...features: FeaturePermission[]) =>
  SetMetadata(FEATURE_KEY, features);
