import { cleanup, createEvent, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BoardCardColumns } from './BoardCardColumns';

const boardWorkItems = {
  columns: [
    {
      columnId: 'column-ready',
      columnName: 'Ready',
      workItems: [
        { id: 'story-1', key: 'TRK-1', title: 'First story', statusKey: 'ready' },
        { id: 'story-2', key: 'TRK-2', title: 'Second story', statusKey: 'ready' },
        { id: 'story-3', key: 'TRK-3', title: 'Third story', statusKey: 'ready' },
      ],
    },
  ],
};

const dataTransfer = () => {
  const values = new Map();
  return {
    effectAllowed: '',
    getData: vi.fn((type) => values.get(type)),
    setData: vi.fn((type, value) => values.set(type, value)),
  };
};

const cardFor = (title) => screen.getByText(title).closest('article');

const dropAt = (target, transfer, clientY) => {
  const event = createEvent.drop(target, { dataTransfer: transfer });
  Object.defineProperty(event, 'clientY', { value: clientY });
  fireEvent(target, event);
};

describe('BoardCardColumns', () => {
  afterEach(() => {
    cleanup();
  });

  it('drops a card before the target when released above the target midpoint', () => {
    const onMove = vi.fn();
    const transfer = dataTransfer();
    render(<BoardCardColumns boardWorkItems={boardWorkItems} onMove={onMove} />);

    const draggedCard = cardFor('First story');
    const targetCard = cardFor('Second story');
    targetCard.getBoundingClientRect = () => ({ top: 10, height: 100 });

    fireEvent.dragStart(draggedCard, { dataTransfer: transfer });
    dropAt(targetCard, transfer, 30);

    expect(onMove).toHaveBeenCalledWith('story-1', expect.objectContaining({
      targetColumnId: 'column-ready',
      nextWorkItemId: 'story-2',
    }));
  });

  it('drops a card after the target when released below the target midpoint', () => {
    const onMove = vi.fn();
    const transfer = dataTransfer();
    render(<BoardCardColumns boardWorkItems={boardWorkItems} onMove={onMove} />);

    const draggedCard = cardFor('First story');
    const targetCard = cardFor('Second story');
    targetCard.getBoundingClientRect = () => ({ top: 10, height: 100 });

    fireEvent.dragStart(draggedCard, { dataTransfer: transfer });
    dropAt(targetCard, transfer, 90);

    expect(onMove).toHaveBeenCalledWith('story-1', expect.objectContaining({
      targetColumnId: 'column-ready',
      previousWorkItemId: 'story-2',
      nextWorkItemId: 'story-3',
    }));
  });
});
