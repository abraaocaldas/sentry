import type {KnownDataDetails} from 'sentry/components/events/contexts/utils';
import {t} from 'sentry/locale';

import formatMemory from './formatMemory';
import type {GPUData} from './types';
import {GPUKnownDataType} from './types';

type Props = {
  data: GPUData;
  type: GPUKnownDataType;
};

export function getGPUKnownDataDetails({data, type}: Props): KnownDataDetails {
  switch (type) {
    case GPUKnownDataType.NAME:
      return {
        subject: t('Name'),
        value: data.name,
      };
    case GPUKnownDataType.VERSION:
      return {
        subject: t('Version'),
        value: data.version,
      };
    case GPUKnownDataType.ID:
      return {
        subject: t('GPU ID'),
        value: data.id,
      };
    case GPUKnownDataType.VENDOR_ID:
      return {
        subject: t('Vendor ID'),
        value: data.vendor_id,
      };
    case GPUKnownDataType.VENDOR_NAME:
      return {
        subject: t('Vendor Name'),
        value: data.vendor_name,
      };
    case GPUKnownDataType.MEMORY_SIZE:
      return {
        subject: t('Memory'),
        value: data.memory_size ? formatMemory(data.memory_size) : undefined,
      };
    case GPUKnownDataType.API_TYPE:
      return {
        subject: t('API Type'),
        value: data.api_type,
      };
    case GPUKnownDataType.MULTI_THREAD_RENDERING:
      return {
        subject: t('Multi-Thread Rendering'),
        value: data.multi_threaded_rendering,
      };
    case GPUKnownDataType.NPOT_SUPPORT:
      return {
        subject: t('NPOT Support'),
        value: data.npot_support,
      };
    case GPUKnownDataType.MAX_TEXTURE_SIZE:
      return {
        subject: t('Max Texture Size'),
        value: data.max_texture_size,
      };
    case GPUKnownDataType.GRAPHICS_SHADER_LEVEL:
      return {
        subject: t('Approx. Shader Capability'),
        value: data.graphics_shader_level,
      };
    case GPUKnownDataType.SUPPORTS_DRAW_CALL_INSTANCING:
      return {
        subject: t('Supports Draw Call Instancing'),
        value: data.supports_draw_call_instancing,
      };
    case GPUKnownDataType.SUPPORTS_RAY_TRACING:
      return {
        subject: t('Supports Ray Tracing'),
        value: data.supports_ray_tracing,
      };
    case GPUKnownDataType.SUPPORTS_COMPUTE_SHADERS:
      return {
        subject: t('Supports Compute Shaders'),
        value: data.supports_compute_shaders,
      };
    case GPUKnownDataType.SUPPORTS_GEOMETRY_SHADERS:
      return {
        subject: t('Supports Geometry Shaders'),
        value: data.supports_geometry_shaders,
      };
    default:
      return undefined;
  }
}
