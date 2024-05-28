import ExternalLink from 'sentry/components/links/externalLink';
import widgetCallout from 'sentry/components/onboarding/gettingStartedDoc/feedback/widgetCallout';
import {StepType} from 'sentry/components/onboarding/gettingStartedDoc/step';
import type {
  Docs,
  DocsParams,
  OnboardingConfig,
} from 'sentry/components/onboarding/gettingStartedDoc/types';
import {
  getCrashReportJavaScriptInstallStep,
  getCrashReportModalConfigDescription,
  getCrashReportModalIntroduction,
} from 'sentry/components/onboarding/gettingStartedDoc/utils/feedbackOnboarding';
import exampleSnippets from 'sentry/components/onboarding/gettingStartedDoc/utils/metricsExampleSnippets';
import {metricTagsExplanation} from 'sentry/components/onboarding/gettingStartedDoc/utils/metricsOnboarding';
import replayOnboardingJsLoader from 'sentry/gettingStartedDocs/javascript/jsLoader/jsLoader';
import {t, tct} from 'sentry/locale';

type Params = DocsParams;

const getInstallConfig = () => [
  {
    language: 'bash',
    code: 'bun add @sentry/bun',
  },
];

const getConfigureSnippet = (params: Params) => `
//...
import * as Sentry from "@sentry/bun";

Sentry.init({
  dsn: "${params.dsn}",${
    params.isPerformanceSelected
      ? `
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of the transactions`
      : ''
  }
});`;

const getVerifySnippet = () => `try {
  throw new Error('Sentry Bun test');
} catch (e) {
  Sentry.captureException(e);
}`;

const getMetricsConfigureSnippet = (params: DocsParams) => `
Sentry.init({
  dsn: "${params.dsn}",
  // Only needed for SDK versions < 8.0.0
  // _experiments: {
  //   metricsAggregator: true,
  // },
});`;

const onboarding: OnboardingConfig = {
  install: () => [
    {
      type: StepType.INSTALL,
      description: t(
        "Sentry captures data by using an SDK within your application's runtime."
      ),
      configurations: getInstallConfig(),
    },
  ],
  configure: params => [
    {
      type: StepType.CONFIGURE,
      description: t(
        "Initialize Sentry as early as possible in your application's lifecycle."
      ),
      configurations: [
        {
          language: 'javascript',
          code: getConfigureSnippet(params),
        },
      ],
    },
  ],
  verify: () => [
    {
      type: StepType.VERIFY,
      description: t(
        "This snippet contains an intentional error and can be used as a test to make sure that everything's working as expected."
      ),
      configurations: [
        {
          language: 'javascript',
          code: getVerifySnippet(),
        },
      ],
    },
  ],
  nextSteps: params =>
    params.isPerformanceSelected
      ? []
      : [
          {
            id: 'performance-monitoring',
            name: t('Performance Monitoring'),
            description: t(
              'Track down transactions to connect the dots between 10-second page loads and poor-performing API calls or slow database queries.'
            ),
            link: 'https://docs.sentry.io/platforms/javascript/guides/bun/performance/',
          },
        ],
};

const customMetricsOnboarding: OnboardingConfig = {
  install: () => [
    {
      type: StepType.INSTALL,
      description: tct(
        'You need a minimum version [codeVersion:7.91.0] of [codePackage:@sentry/bun].',
        {
          codeVersion: <code />,
          codePackage: <code />,
        }
      ),
      configurations: getInstallConfig(),
    },
  ],
  configure: params => [
    {
      type: StepType.CONFIGURE,
      description: t(
        'With the default snippet in place, there is no need for any further configuration.'
      ),
      configurations: [
        {
          code: getMetricsConfigureSnippet(params),
          language: 'javascript',
        },
      ],
    },
  ],
  verify: () => [
    {
      type: StepType.VERIFY,
      description: tct(
        "Then you'll be able to add metrics as [codeCounters:counters], [codeSets:sets], [codeDistribution:distributions], and [codeGauge:gauges]. These are available under the [codeNamespace:Sentry.metrics] namespace. This API is available in both renderer and main processes.",
        {
          codeCounters: <code />,
          codeSets: <code />,
          codeDistribution: <code />,
          codeGauge: <code />,
          codeNamespace: <code />,
        }
      ),
      configurations: [
        {
          description: metricTagsExplanation,
        },
        {
          description: t('Try out these examples:'),
          code: [
            {
              label: 'Counter',
              value: 'counter',
              language: 'javascript',
              code: exampleSnippets.javascript.counter,
            },
            {
              label: 'Distribution',
              value: 'distribution',
              language: 'javascript',
              code: exampleSnippets.javascript.distribution,
            },
            {
              label: 'Set',
              value: 'set',
              language: 'javascript',
              code: exampleSnippets.javascript.set,
            },
            {
              label: 'Gauge',
              value: 'gauge',
              language: 'javascript',
              code: exampleSnippets.javascript.gauge,
            },
          ],
        },
        {
          description: t(
            'With a bit of delay you can see the data appear in the Sentry UI.'
          ),
        },
        {
          description: tct(
            'Learn more about metrics and how to configure them, by reading the [docsLink:docs].',
            {
              docsLink: (
                <ExternalLink href="https://docs.sentry.io/platforms/javascript/guides/bun/metrics/" />
              ),
            }
          ),
        },
      ],
    },
  ],
};

const crashReportOnboarding: OnboardingConfig = {
  introduction: () => getCrashReportModalIntroduction(),
  install: (params: Params) => getCrashReportJavaScriptInstallStep(params),
  configure: () => [
    {
      type: StepType.CONFIGURE,
      description: getCrashReportModalConfigDescription({
        link: 'https://docs.sentry.io/platforms/javascript/guides/bun/user-feedback/configuration/#crash-report-modal',
      }),
      additionalInfo: widgetCallout({
        link: 'https://docs.sentry.io/platforms/javascript/guides/bun/user-feedback/#user-feedback-widget',
      }),
    },
  ],
  verify: () => [],
  nextSteps: () => [],
};

const docs: Docs = {
  onboarding,
  replayOnboardingJsLoader,
  customMetricsOnboarding,
  crashReportOnboarding,
};

export default docs;
