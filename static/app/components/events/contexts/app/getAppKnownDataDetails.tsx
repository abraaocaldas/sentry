import {t} from 'sentry/locale';
import type {Event} from 'sentry/types/event';
import {formatBytesBase2} from 'sentry/utils/bytes/formatBytesBase2';

import {getRelativeTimeFromEventDateCreated, type KnownDataDetails} from '../utils';

import type {AppData} from './types';
import {AppKnownDataType} from './types';

type Props = {
  data: AppData;
  event: Event;
  type: AppKnownDataType;
};

// https://github.com/getsentry/relay/blob/24.10.0/relay-event-schema/src/protocol/contexts/app.rs#L37
function formatMemory(memoryInBytes: number) {
  if (!Number.isInteger(memoryInBytes) || memoryInBytes <= 0) {
    return null;
  }
  return formatBytesBase2(memoryInBytes);
}

export function getAppKnownDataDetails({data, event, type}: Props): KnownDataDetails {
  switch (type) {
    case AppKnownDataType.ID:
      return {
        subject: t('ID'),
        value: data.app_id,
      };
    case AppKnownDataType.START_TIME:
      return {
        subject: t('Start Time'),
        value: getRelativeTimeFromEventDateCreated(
          event.dateCreated ? event.dateCreated : event.dateReceived,
          data.app_start_time
        ),
      };
    case AppKnownDataType.DEVICE_HASH:
      return {
        subject: t('Device'),
        value: data.device_app_hash,
      };
    case AppKnownDataType.TYPE:
      return {
        subject: t('Build Type'),
        value: data.build_type,
      };
    case AppKnownDataType.IDENTIFIER:
      return {
        subject: t('Build ID'),
        value: data.app_identifier,
      };
    case AppKnownDataType.NAME:
      return {
        subject: t('Build Name'),
        value: data.app_name,
      };
    case AppKnownDataType.VERSION:
      return {
        subject: t('Version'),
        value: data.app_version,
      };
    case AppKnownDataType.BUILD:
      return {
        subject: t('App Build'),
        value: data.app_build,
      };
    case AppKnownDataType.IN_FOREGROUND:
      return {
        subject: t('In Foreground'),
        value: data.in_foreground,
      };
    case AppKnownDataType.MEMORY:
      return {
        subject: t('Memory Usage'),
        value: data.app_memory ? formatMemory(data.app_memory) : undefined,
      };
    case AppKnownDataType.VIEW_NAMES:
      return {
        subject: t('View Names'),
        value: data.view_names,
      };
    default:
      return undefined;
  }
}
