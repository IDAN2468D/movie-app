import React from 'react';
import { render } from '@testing-library/react-native';
import LiquidBackground from '../LiquidBackground';

// Global mocks are in jest-setup.js


describe('LiquidBackground Component', () => {
  it('renders correctly', () => {
    const { toJSON } = render(<LiquidBackground />);
    expect(toJSON()).toBeDefined();
  });

  it('accepts custom color props', () => {
    const { toJSON } = render(<LiquidBackground primaryColor="#FF0000" secondaryColor="#0000FF" />);
    expect(toJSON()).toBeDefined();
  });
});
