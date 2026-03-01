'use client';

import { useEffect } from 'react';

type SortDirection = 'asc' | 'desc';

function getCellValue(row: HTMLTableRowElement, columnIndex: number) {
  const cell = row.cells[columnIndex];
  return (cell?.textContent || '').replace(/\s+/g, ' ').trim();
}

function compareCellValues(a: string, b: string, collator: Intl.Collator) {
  const dateA = Date.parse(a);
  const dateB = Date.parse(b);
  if (!Number.isNaN(dateA) && !Number.isNaN(dateB)) {
    return dateA - dateB;
  }

  const numericA = Number(a.replace(/[^0-9.-]/g, ''));
  const numericB = Number(b.replace(/[^0-9.-]/g, ''));
  const hasNumberA = /[0-9]/.test(a);
  const hasNumberB = /[0-9]/.test(b);
  if (hasNumberA && hasNumberB && !Number.isNaN(numericA) && !Number.isNaN(numericB)) {
    return numericA - numericB;
  }

  return collator.compare(a, b);
}

function sortTableByColumn(table: HTMLTableElement, columnIndex: number, direction: SortDirection) {
  const tbody = table.tBodies[0];
  if (!tbody) return;

  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  const rows = Array.from(tbody.rows);

  rows.sort((rowA, rowB) => {
    const valueA = getCellValue(rowA, columnIndex);
    const valueB = getCellValue(rowB, columnIndex);
    const comparison = compareCellValues(valueA, valueB, collator);
    return direction === 'asc' ? comparison : -comparison;
  });

  rows.forEach((row) => tbody.appendChild(row));
}

export function GlobalTableSorter() {
  useEffect(() => {
    const disposers: Array<() => void> = [];

    const enhanceTable = (table: HTMLTableElement) => {
      if (table.dataset.sortEnhanced === 'true') return;

      const thead = table.tHead;
      const tbody = table.tBodies[0];
      if (!thead || !tbody) return;

      const headerRow = thead.rows[thead.rows.length - 1];
      if (!headerRow) return;

      const headers = Array.from(headerRow.cells).filter(
        (cell): cell is HTMLTableCellElement => cell.tagName === 'TH'
      );

      headers.forEach((header, headerIndex) => {
        if (header.querySelector('input, button, [role="button"]')) return;
        if (header.dataset.sortDisabled === 'true') return;

        if (!header.querySelector('.table-sort-indicator')) {
          const indicator = document.createElement('span');
          indicator.className = 'table-sort-indicator';
          indicator.setAttribute('aria-hidden', 'true');
          indicator.innerHTML = '<span class="table-sort-up">&#8593;</span><span class="table-sort-down">&#8595;</span>';
          header.appendChild(indicator);
        }

        header.classList.add('table-sortable-header');
        header.tabIndex = 0;

        const handleSort = () => {
          const activeColumn = Number(table.dataset.sortColumn ?? '-1');
          const currentDirection = (table.dataset.sortDirection as SortDirection | undefined) ?? 'asc';
          const nextDirection: SortDirection =
            activeColumn === headerIndex && currentDirection === 'asc' ? 'desc' : 'asc';

          sortTableByColumn(table, headerIndex, nextDirection);

          table.dataset.sortColumn = String(headerIndex);
          table.dataset.sortDirection = nextDirection;

          headers.forEach((cell, index) => {
            cell.classList.remove('table-sort-active-asc', 'table-sort-active-desc');
            if (index === headerIndex) {
              cell.classList.add(nextDirection === 'asc' ? 'table-sort-active-asc' : 'table-sort-active-desc');
            }
          });
        };

        const onClick = (event: Event) => {
          event.preventDefault();
          handleSort();
        };

        const onKeyDown = (event: KeyboardEvent) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleSort();
          }
        };

        header.addEventListener('click', onClick);
        header.addEventListener('keydown', onKeyDown);
        disposers.push(() => {
          header.removeEventListener('click', onClick);
          header.removeEventListener('keydown', onKeyDown);
        });
      });

      table.dataset.sortEnhanced = 'true';
    };

    const enhanceAllTables = () => {
      document.querySelectorAll('table').forEach((tableNode) => {
        enhanceTable(tableNode as HTMLTableElement);
      });
    };

    enhanceAllTables();

    const observer = new MutationObserver(() => {
      enhanceAllTables();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      disposers.forEach((dispose) => dispose());
    };
  }, []);

  return null;
}

