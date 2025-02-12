import {Fragment, useCallback, useMemo} from 'react';
import styled from '@emotion/styled';

import Feature from 'sentry/components/acl/feature';
import {getInterval} from 'sentry/components/charts/utils';
import {CompactSelect} from 'sentry/components/compactSelect';
import {DropdownMenu} from 'sentry/components/dropdownMenu';
import {Tooltip} from 'sentry/components/tooltip';
import {CHART_PALETTE} from 'sentry/constants/chartPalette';
import {IconClock, IconGraph, IconSubscribed} from 'sentry/icons';
import {t} from 'sentry/locale';
import {space} from 'sentry/styles/space';
import {dedupeArray} from 'sentry/utils/dedupeArray';
import {
  aggregateOutputType,
  formatParsedFunction,
  parseFunction,
} from 'sentry/utils/discover/fields';
import {MutableSearch} from 'sentry/utils/tokenizeSearch';
import useOrganization from 'sentry/utils/useOrganization';
import usePageFilters from 'sentry/utils/usePageFilters';
import useProjects from 'sentry/utils/useProjects';
import {formatVersion} from 'sentry/utils/versions/formatVersion';
import {Dataset} from 'sentry/views/alerts/rules/metric/types';
import {useChartInterval} from 'sentry/views/explore/hooks/useChartInterval';
import {useDataset} from 'sentry/views/explore/hooks/useDataset';
import {useVisualizes} from 'sentry/views/explore/hooks/useVisualizes';
import Chart, {
  ChartType,
  useSynchronizeCharts,
} from 'sentry/views/insights/common/components/chart';
import ChartPanel from 'sentry/views/insights/common/components/chartPanel';
import {useSortedTimeSeries} from 'sentry/views/insights/common/queries/useSortedTimeSeries';
import {getAlertsUrl} from 'sentry/views/insights/common/utils/getAlertsUrl';
import {CHART_HEIGHT} from 'sentry/views/insights/database/settings';

import {useGroupBys} from '../hooks/useGroupBys';
import {useResultMode} from '../hooks/useResultsMode';
import {useSorts} from '../hooks/useSorts';
import {TOP_EVENTS_LIMIT, useTopEvents} from '../hooks/useTopEvents';
import {formatSort} from '../tables/aggregatesTable';

interface ExploreChartsProps {
  query: string;
}

const exploreChartTypeOptions = [
  {
    value: ChartType.LINE,
    label: t('Line'),
  },
  {
    value: ChartType.AREA,
    label: t('Area'),
  },
  {
    value: ChartType.BAR,
    label: t('Bar'),
  },
];

export const EXPLORE_CHART_GROUP = 'explore-charts_group';

// TODO: Update to support aggregate mode and multiple queries / visualizations
export function ExploreCharts({query}: ExploreChartsProps) {
  const pageFilters = usePageFilters();
  const organization = useOrganization();
  const {projects} = useProjects();

  const [dataset] = useDataset();
  const [visualizes, setVisualizes] = useVisualizes();
  const [interval, setInterval, intervalOptions] = useChartInterval();
  const {groupBys} = useGroupBys();
  const [resultMode] = useResultMode();
  const topEvents = useTopEvents();

  const fields: string[] = useMemo(() => {
    if (resultMode === 'samples') {
      return [];
    }

    return [...groupBys, ...visualizes.flatMap(visualize => visualize.yAxes)].filter(
      Boolean
    );
  }, [resultMode, groupBys, visualizes]);
  const [sorts] = useSorts({fields});

  const orderby: string | string[] | undefined = useMemo(() => {
    if (!sorts.length) {
      return undefined;
    }

    return sorts.map(formatSort);
  }, [sorts]);

  const yAxes = useMemo(() => {
    const deduped = dedupeArray(visualizes.flatMap(visualize => visualize.yAxes));
    deduped.sort();
    return deduped;
  }, [visualizes]);

  const timeSeriesResult = useSortedTimeSeries(
    {
      search: new MutableSearch(query ?? ''),
      yAxis: yAxes,
      interval: interval ?? getInterval(pageFilters.selection.datetime, 'metrics'),
      fields,
      orderby,
      topEvents,
    },
    'api.explorer.stats',
    dataset
  );

  const getSeries = useCallback(
    (dedupedYAxes: string[]) => {
      return dedupedYAxes.flatMap(yAxis => {
        const series = timeSeriesResult.data[yAxis];
        return series !== undefined ? series : [];
      });
    },
    [timeSeriesResult]
  );

  const handleChartTypeChange = useCallback(
    (chartType: ChartType, index: number) => {
      const newVisualizes = visualizes.slice();
      newVisualizes[index] = {...newVisualizes[index], chartType};
      setVisualizes(newVisualizes);
    },
    [visualizes, setVisualizes]
  );

  useSynchronizeCharts(
    visualizes.length,
    !timeSeriesResult.isPending,
    EXPLORE_CHART_GROUP
  );

  return (
    <Fragment>
      {visualizes.map((visualize, index) => {
        const dedupedYAxes = dedupeArray(visualize.yAxes);

        const formattedYAxes = dedupedYAxes
          .map(yaxis => {
            const func = parseFunction(yaxis);
            return func ? formatParsedFunction(func) : undefined;
          })
          .filter(Boolean);

        const {chartType, yAxes: visualizeYAxes} = visualize;
        const chartIcon =
          chartType === ChartType.LINE
            ? 'line'
            : chartType === ChartType.AREA
              ? 'area'
              : 'bar';

        const project =
          projects.length === 1
            ? projects[0]
            : projects.find(p => p.id === `${pageFilters.selection.projects[0]}`);
        const singleProject =
          (pageFilters.selection.projects.length === 1 || projects.length === 1) &&
          project;
        const alertsUrls = singleProject
          ? visualizeYAxes.map(yAxis => ({
              key: yAxis,
              label: yAxis,
              to: getAlertsUrl({
                project,
                query,
                pageFilters: pageFilters.selection,
                aggregate: yAxis,
                orgSlug: organization.slug,
                dataset: Dataset.EVENTS_ANALYTICS_PLATFORM,
                interval,
              }),
            }))
          : undefined;

        return (
          <ChartContainer key={index}>
            <ChartPanel>
              <ChartHeader>
                <ChartTitle>{formattedYAxes.join(',')}</ChartTitle>
                <ChartSettingsContainer>
                  <Tooltip
                    title={t('Type of chart displayed in this visualization (ex. line)')}
                  >
                    <CompactSelect
                      triggerLabel=""
                      triggerProps={{
                        icon: <IconGraph type={chartIcon} />,
                        borderless: true,
                        showChevron: false,
                        size: 'sm',
                      }}
                      value={chartType}
                      menuTitle="Type"
                      options={exploreChartTypeOptions}
                      onChange={option => handleChartTypeChange(option.value, index)}
                    />
                  </Tooltip>
                  <Tooltip
                    title={t('Time interval displayed in this visualization (ex. 5m)')}
                  >
                    <CompactSelect
                      triggerLabel=""
                      value={interval}
                      onChange={({value}) => setInterval(value)}
                      triggerProps={{
                        icon: <IconClock />,
                        borderless: true,
                        showChevron: false,
                        size: 'sm',
                      }}
                      menuTitle="Interval"
                      options={intervalOptions}
                    />
                  </Tooltip>
                  <Feature features="organizations:alerts-eap">
                    <Tooltip
                      title={
                        singleProject
                          ? t('Create an alert for this chart')
                          : t(
                              'Cannot create an alert when multiple projects are selected'
                            )
                      }
                    >
                      <DropdownMenu
                        triggerProps={{
                          'aria-label': t('Create Alert'),
                          size: 'sm',
                          borderless: true,
                          showChevron: false,
                          icon: <IconSubscribed />,
                        }}
                        position="bottom-end"
                        items={alertsUrls ?? []}
                        menuTitle={t('Create an alert for')}
                        isDisabled={!alertsUrls || alertsUrls.length === 0}
                      />
                    </Tooltip>
                  </Feature>
                </ChartSettingsContainer>
              </ChartHeader>
              <Chart
                height={CHART_HEIGHT}
                grid={{
                  left: '0',
                  right: '0',
                  top: '8px',
                  bottom: '0',
                }}
                legendFormatter={value => formatVersion(value)}
                data={getSeries(dedupedYAxes)}
                error={timeSeriesResult.error}
                loading={timeSeriesResult.isPending}
                chartGroup={EXPLORE_CHART_GROUP}
                // TODO Abdullah: Make chart colors dynamic, with changing topN events count and overlay count.
                chartColors={CHART_PALETTE[TOP_EVENTS_LIMIT - 1]}
                type={chartType}
                // for now, use the first y axis unit
                aggregateOutputFormat={aggregateOutputType(dedupedYAxes[0])}
              />
            </ChartPanel>
          </ChartContainer>
        );
      })}
    </Fragment>
  );
}

const ChartContainer = styled('div')`
  display: grid;
  gap: 0;
  grid-template-columns: 1fr;
  margin-bottom: ${space(2)};
`;

const ChartHeader = styled('div')`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

const ChartTitle = styled('div')`
  ${p => p.theme.text.cardTitle}
`;

const ChartSettingsContainer = styled('div')`
  display: flex;
`;
