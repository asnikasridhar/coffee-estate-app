import React from 'react';
import { render, cleanup } from '@testing-library/react-native';
import { API_ENVIRONMENTS, resolveEnvironment } from '../src/config/environment';
import EnvironmentWatermark from '../src/components/EnvironmentWatermark';

afterEach(async () => { await cleanup(); });

test('unconfigured app defaults to the new DEV API', () => {
  expect(resolveEnvironment()).toEqual({ environment: 'dev', apiBase: API_ENVIRONMENTS.dev.apiBase, watermark: 'DEV' });
});
test.each([['dev', 'DEV'], ['stg', 'STG'], ['prod', '']])('%s uses the matching API and watermark', (environment, watermark) => {
  expect(resolveEnvironment(environment)).toEqual({ environment, apiBase: API_ENVIRONMENTS[environment].apiBase, watermark });
});
test('URL overrides cannot mislabel a hosted environment', () => {
  expect(resolveEnvironment('prod', API_ENVIRONMENTS.stg.apiBase + '/').watermark).toBe('STG');
  expect(resolveEnvironment('dev', API_ENVIRONMENTS.prod.apiBase).watermark).toBe('');
  expect(resolveEnvironment('prod', 'http://localhost:8787/api').watermark).toBe('DEV');
  expect(() => resolveEnvironment('typo')).toThrow('EXPO_PUBLIC_APP_ENV');
});
test.each(['DEV', 'STG'])('%s watermark is visible and does not capture touches', async label => {
  const view = await render(<EnvironmentWatermark label={label}/>);
  expect(view.getByText(label)).toBeTruthy();
  expect(view.getByLabelText(`${label} environment`).props.pointerEvents).toBe('none');
});
test('production renders no environment watermark', async () => {
  const view = await render(<EnvironmentWatermark label=""/>);
  expect(view.toJSON()).toBeNull();
});
