import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TicketCard from '../../components/TicketCard';

const mockTicket = {
  id: '1',
  movieTitle: 'Inception',
  movieId: 123,
  date: '2024-05-20',
  bookingDate: '2024-05-12T19:50:00Z',
  showtime: {
    id: 's1',
    time: '20:00',
    hall: 'Hall 1',
    format: 'Standard' as const,
    price: 40,
  },
  seats: [{ row: 'A', number: 1, type: 'standard' as const, status: 'taken' as const }],
  totalPrice: 40,
  posterPath: '/inception.jpg',
};

describe('TicketCard', () => {
  it('renders ticket information correctly', () => {
    const { getByText } = render(
      <TicketCard ticket={mockTicket} onPress={() => {}} />
    );

    expect(getByText('Inception')).toBeTruthy();
    expect(getByText('2024-05-20')).toBeTruthy();
    expect(getByText('20:00')).toBeTruthy();
    expect(getByText('Hall 1')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByTestId } = render(
      <TicketCard ticket={mockTicket} onPress={onPressMock} />
    );

    const card = getByTestId('ticket-card-1');
    fireEvent.press(card);

    expect(onPressMock).toHaveBeenCalled();
  });
});
