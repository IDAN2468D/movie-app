import React from 'react';
import { render } from '@testing-library/react-native';
import LiquidBackground from '../LiquidBackground';

// Global mocks are in jest-setup.js


describe('LiquidBackground Component', () => {
  it('renders correctly', () => {
    const { toJSON } = render(<LiquidBackground />);
    expect(toJSON()).toBeDefined();
  });

  it('accepts movieColor prop', () => {
    const { toJSON } = render(<LiquidBackground movieColor="#FF0000" />);
    expect(toJSON()).toBeDefined();
  });
});
