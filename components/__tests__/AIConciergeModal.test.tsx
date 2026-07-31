import React from 'react';
import { render } from '@testing-library/react-native';
import AIConciergeModal from '../AIConciergeModal';

describe('AIConciergeModal Component', () => {
  it('renders correctly when visible', () => {
    const { toJSON } = render(
      <AIConciergeModal visible={true} onClose={() => {}} />
    );
    expect(toJSON()).toBeDefined();
  });
});
