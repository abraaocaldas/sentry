import {EventFixture} from 'sentry-fixture/event';

import {render, screen, userEvent} from 'sentry-test/reactTestingLibrary';
import {textWithMarkupMatcher} from 'sentry-test/utils';

import {RuntimeEventContext} from 'sentry/components/events/contexts/runtime';

export const runtimeMockData = {
  version: '1.7.13',
  type: 'runtime',
  raw_description: '',
  build: '2.7.18 (default, Apr 20 2020, 19:34:11) \n[GCC 8.3.0]',
  name: '',
};

export const runtimeMetaMockData = {
  name: {
    '': {
      chunks: [
        {
          remark: 'x',
          rule_id: 'project:0',
          text: '',
          type: 'redaction',
        },
      ],
      len: 98,
      rem: [['project:0', 'x', 0, 0]],
    },
  },
};

const event = EventFixture({
  _meta: {
    contexts: {
      runtime: runtimeMetaMockData,
    },
  },
});

describe('runtime event context', function () {
  it('display redacted data', async function () {
    render(<RuntimeEventContext event={event} data={runtimeMockData} />);

    expect(screen.getByText('Name')).toBeInTheDocument(); // subject
    expect(screen.getByText(/redacted/)).toBeInTheDocument(); // value
    await userEvent.hover(screen.getByText(/redacted/));
    expect(
      await screen.findByText(
        textWithMarkupMatcher(
          "Removed because of a data scrubbing rule in your project's settings"
        ) // Fall back case
      )
    ).toBeInTheDocument(); // tooltip description
  });
});
